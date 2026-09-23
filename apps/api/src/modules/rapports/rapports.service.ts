import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { PersonnelService, RechercheParams } from '../personnel/personnel.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuditService } from '../../common/audit/audit.service';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

(pdfMake as unknown as { vfs: unknown }).vfs = pdfFonts.pdfMake?.vfs ?? (pdfFonts as unknown as { vfs: unknown }).vfs;

const COLONNES = [
  { header: 'Matricule', key: 'matricule', width: 18 },
  { header: 'Nom', key: 'nom', width: 20 },
  { header: 'Prénoms', key: 'prenoms', width: 24 },
  { header: 'Date naissance', key: 'dateNaissance', width: 14 },
  { header: 'Lieu naissance', key: 'lieuNaissance', width: 16 },
  { header: 'Sexe', key: 'sexe', width: 7 },
  { header: 'Grade', key: 'categorie', width: 16 },
  { header: 'Situation familiale', key: 'situationFamiliale', width: 16 },
  { header: 'Contact', key: 'contact', width: 22 },
];

@Injectable()
export class RapportsService {
  constructor(
    private readonly personnel: PersonnelService,
    private readonly dashboard: DashboardService,
    private readonly audit: AuditService,
  ) {}

  private lignesAplates(rows: any[]): Array<Record<string, unknown>> {
    return rows.map((r) => {
      const grade = r.grade?.libelle ?? '—';
      return {
        matricule: r.matriculeRecrutement,
        nom: r.nom,
        prenoms: r.prenoms,
        dateNaissance: r.dateNaissance ? r.dateNaissance.toISOString().slice(0, 10) : '',
        lieuNaissance: r.lieuNaissance ?? '',
        sexe: r.sexe,
        categorie: grade,
        situationFamiliale: r.situationFamiliale ?? '',
        contact: `${r.email ?? ''} ${r.telephone ?? ''}`.trim(),
      };
    }).map((r) => ({
      ...r,
      contact: String(r.contact ?? ''),
    }));
  }

  async exporterExcel(user: RequestUser, params: RechercheParams): Promise<{ buffer: Buffer; nom: string }> {
    const resultat = await this.personnel.rechercher(user, { ...params, pageSize: 500, page: 1 }) as {
      items: Array<Record<string, any>>;
    };
    const items = resultat.items;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Personnel');
    ws.columns = COLONNES;
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    const lignes = this.lignesAplates(items as never);
    for (const l of lignes) ws.addRow(l);
    const buffer = await wb.xlsx.writeBuffer();
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Personnel', details: { lignes: lignes.length } });
    return { buffer: Buffer.from(buffer), nom: 'export_personnel.xlsx' };
  }

  /** Classement par grade avec sous-totaux (CDC §2.6 — impressions). */
  async classementGrade(user: RequestUser, params: RechercheParams): Promise<{ items: Array<Record<string, any>>; grades: Array<{ libelle: string; effectif: number }> }> {
    const resultat = await this.personnel.rechercher(user, { ...params, pageSize: 500, page: 1 }) as {
      items: Array<Record<string, any>>;
    };
    const items = resultat.items;
    const parGrade = new Map<string, Array<Record<string, any>>>();
    for (const p of items) {
      const libelle = p.grade?.libelle ?? '—';
      const liste = parGrade.get(libelle) ?? [];
      liste.push(p);
      parGrade.set(libelle, liste);
    }
    const grades = [...parGrade.entries()]
      .map(([libelle, liste]) => ({ libelle, effectif: liste.length }))
      .sort((a, b) => b.effectif - a.effectif || a.libelle.localeCompare(b.libelle));
    return { items, grades };
  }

  async classementGradePdf(user: RequestUser, params: RechercheParams): Promise<{ buffer: Buffer; nom: string }> {
    const { items } = await this.classementGrade(user, params);
    const groupe = new Map<string, Array<Record<string, any>>>();
    for (const p of items) {
      const libelle = p.grade?.libelle ?? '—';
      const liste = groupe.get(libelle) ?? [];
      liste.push(p);
      groupe.set(libelle, liste);
    }

    const corps: unknown[] = [];
    for (const [libelle, liste] of groupe) {
      corps.push({ text: libelle, style: 'grade', margin: [0, 10, 0, 4] });
      const lignes = liste
        .sort((a, b) => String(a.nom).localeCompare(String(b.nom)))
        .map((p: Record<string, any>) => [
          String(p.matriculeRecrutement ?? ''),
          `${String(p.nom ?? '')} ${String(p.prenoms ?? '')}`.trim(),
          p.dateNaissance ? new Date(p.dateNaissance).toISOString().slice(0, 10) : '',
          String(p.sexe ?? ''),
        ]);
      corps.push({
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto'],
          body: [
            [{ text: 'Matricule', style: 'thead' }, { text: 'Nom et prénoms', style: 'thead' }, { text: 'Naissance', style: 'thead' }, { text: 'Sexe', style: 'thead' }],
            ...lignes,
            [{ text: `Sous-total : ${liste.length}`, colSpan: 4, style: 'soustotal', alignment: 'right' }, {}, {}, {}],
          ],
        },
      });
    }
    const total = items.length;

    const doc = pdfMake.createPdf({
      content: [
        { text: 'État-Major de la Marine Nationale — GRH', style: 'titre' },
        { text: 'Classement des effectifs par grade', style: 'soustitre' },
        { text: `Généré le ${new Date().toLocaleString('fr-FR')} — Effectif pris : ${total}` },
        ...corps,
      ],
      styles: {
        titre: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
        soustitre: { fontSize: 12, bold: true, margin: [0, 0, 0, 4] },
        grade: { fontSize: 11, bold: true },
        thead: { bold: true, fillColor: '#1B2A4A', color: '#FFFFFF' },
        soustotal: { bold: true, italics: true, fillColor: '#EEF1F8' },
      },
      defaultStyle: { fontSize: 10 },
    });
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.getBuffer((b: Buffer, err?: unknown) => (err ? reject(err) : resolve(b)));
    });
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Rapport', details: { type: 'classement-grade' } });
    return { buffer, nom: 'classement_par_grade.pdf' };
  }

  async classementGradeExcel(user: RequestUser, params: RechercheParams): Promise<{ buffer: Buffer; nom: string }> {
    const { grades } = await this.classementGrade(user, params);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Classement par grade');
    ws.columns = [
      { header: 'Grade', key: 'libelle', width: 28 },
      { header: 'Effectif', key: 'effectif', width: 12 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
    for (const g of grades) ws.addRow(g);
    ws.addRow({ libelle: 'TOTAL', effectif: grades.reduce((s, g) => s + g.effectif, 0) });
    const ligneTotal = ws.getRow(ws.rowCount);
    if (ligneTotal) ligneTotal.font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Rapport', details: { type: 'classement-grade-excel' } });
    return { buffer: Buffer.from(buffer), nom: 'classement_par_grade.xlsx' };
  }

  /** Liste du personnel par unité (Excel) avec sous-totaux — CDC §2.6. */
  async personnelParUniteExcel(user: RequestUser): Promise<{ buffer: Buffer; nom: string }> {
    const resultat = await this.personnel.rechercher(user, { pageSize: 500, page: 1 }) as {
      items: Array<Record<string, any>>;
    };
    const parUnite = new Map<string, Array<Record<string, any>>>();
    for (const p of resultat.items) {
      const libelle = `${p.unite?.base?.nom ?? ''} — ${p.unite?.nom ?? '—'}`;
      const liste = parUnite.get(libelle) ?? [];
      liste.push(p);
      parUnite.set(libelle, liste);
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Personnel par unité');
    ws.columns = [
      { header: 'Unité', key: 'unite', width: 36 },
      { header: 'Matricule', key: 'matricule', width: 18 },
      { header: 'Nom et prénoms', key: 'nom', width: 30 },
      { header: 'Grade', key: 'grade', width: 24 },
      { header: 'Contact', key: 'contact', width: 22 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
    for (const [libelle, liste] of parUnite) {
      ws.addRow({ unite: libelle, matricule: '', nom: '', grade: '', contact: '' });
      const titre = ws.getRow(ws.rowCount);
      if (titre) titre.font = { bold: true };
      for (const p of liste) {
        ws.addRow({
          unite: '',
          matricule: p.matriculeRecrutement ?? '',
          nom: `${String(p.nom ?? '')} ${String(p.prenoms ?? '')}`.trim(),
          grade: p.grade?.libelle ?? '',
          contact: `${p.email ?? ''} ${p.telephoneMobile ?? ''}`.trim(),
        });
      }
      ws.addRow({ unite: '', matricule: '', nom: `Sous-total : ${liste.length}`, grade: '', contact: '' });
      const sousTotal = ws.getRow(ws.rowCount);
      if (sousTotal) sousTotal.font = { bold: true, italic: true };
    }
    const buffer = await wb.xlsx.writeBuffer();
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Rapport', details: { type: 'personnel-unite' } });
    return { buffer: Buffer.from(buffer), nom: 'personnel_par_unite.xlsx' };
  }

  /** Fiche individuelle impressionnable (PDF) — CDC §2.6. */
  async fichePersonnelPdf(user: RequestUser, id: string): Promise<{ buffer: Buffer; nom: string }> {
    const p = await this.personnel.detail(user, id) as Record<string, any>;
    const fmt = (d: Date | string | null | undefined): string =>
      d ? new Date(d).toISOString().slice(0, 10) : '—';
    const rows = [
      ['Matricule', p.matriculeRecrutement ?? '—', 'Grade', p.grade?.libelle ?? '—'],
      ['Nom', p.nom ?? '—', 'Prénoms', p.prenoms ?? '—'],
      ['Date de naissance', fmt(p.dateNaissance), 'Lieu de naissance', p.lieuNaissance ?? '—'],
      ['Sexe', p.sexe ?? '—', 'Situation familiale', p.statutFamilial ?? '—'],
      ['CIN', p.numeroCIN ?? '—', 'Passeport', p.numeroPasseport ?? '—'],
      ['CIM', p.numeroCIM ?? '—', 'Corps', p.corps ?? '—'],
      ['Unité', p.unite?.nom ?? '—', 'Base', p.unite?.base?.nom ?? '—'],
      ['Spécialité', p.specialite?.libelle ?? '—', 'Fonction', p.fonctionActuelle ?? '—'],
      ['Date entrée service', fmt(p.dateEntreeService), 'Situation militaire', p.situationMilitaire ?? '—'],
      ['Adresse', p.adresseActuelle ?? '—', 'Contact', `${p.telephoneMobile ?? ''} ${p.email ?? ''}`.trim() || '—'],
      ['Père', p.nomPere ?? '—', 'Mère', p.nomMere ?? '—'],
    ];
    const group = rows.map((r) => r.map((c) => ({ text: String(c), style: r.indexOf(c) % 2 === 0 ? 'leb' : 'val' })));
    const corps: any[] = [
      { text: 'FICHE INDIVIDUELLE D\'ÉTAT — PERSONNEL', style: 'soustitre' },
      { table: { widths: ['auto', '*', 'auto', '*'], body: [['Label', 'Valeur', 'Label', 'Valeur'], ...group] } },
      { text: ' ', fontSize: 4 },
    ];
    if ((p.enfants ?? []).length > 0) {
      corps.push({ text: 'Enfants', style: 'grade' });
      corps.push({
        table: {
          widths: ['auto', '*', '*'],
          body: [
            ['Nom', 'Date de naissance', 'Sexe'],
            ...p.enfants.map((e: Record<string, any>) => [e.nomPrenom ?? '—', fmt(e.dateNaissance), e.sexe ?? '—']),
          ],
        },
      });
    }

    const doc = pdfMake.createPdf({
      content: [
        { text: 'République de Madagascar — Ministère de la Défense Nationale', style: 'titre' },
        ...corps,
      ],
      styles: {
        titre: { fontSize: 14, bold: true, margin: [0, 0, 0, 8], alignment: 'center' },
        soustitre: { fontSize: 12, bold: true, margin: [0, 6, 0, 6] },
        grade: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
        leb: { bold: true, fillColor: '#EEF1F8' },
        val: {},
      },
      defaultStyle: { fontSize: 9 },
    });
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.getBuffer((b: Buffer, err?: unknown) => (err ? reject(err) : resolve(b)));
    });
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Personnel', entiteId: id, details: { type: 'fiche-pdf' } });
    return { buffer, nom: `fiche_${(p.matriculeRecrutement ?? id).replace(/[^\w-]+/g, '_')}.pdf` };
  }

  async rapportPdf(user: RequestUser): Promise<{ buffer: Buffer; nom: string }> {
    const [synthese, parBase, pyramide] = await Promise.all([
      this.dashboard.synthèse(user),
      this.dashboard.parBase(user),
      this.dashboard.pyramideAges(user),
    ]);

    const doc = pdfMake.createPdf({
      content: [
        { text: 'État-Major de la Marine Nationale — GRH', style: 'titre' },
        { text: 'Synthèse des effectifs', style: 'soustitre' },
        { text: `Généré le ${new Date().toLocaleString('fr-FR')}` },
        { text: ' ' },
        { text: `Effectif total : ${synthese.effectif}` },
        { text: `Officiers : ${synthese.officiers} — Autres : ${synthese.autres}` },
        { text: `Recrutés cette année : ${synthese.recrutesAnnee ?? 0}` },
        { text: ' ' },
        { text: 'Effectifs par base / unité', style: 'soustitre' },
        { table: { headerRows: 1, widths: ['*', '*', 'auto'], body: [['Base', 'Unité', 'Effectif'], ...parBase.map((p: any) => [p.base, p.unite, String(p.effectif)])] } },
        { text: ' ' },
        { text: 'Pyramide des âges', style: 'soustitre' },
        { table: { headerRows: 1, widths: ['auto', 'auto', 'auto'], body: [['Tranche', 'Hommes', 'Femmes'], ...pyramide.map((p: any) => [p.tranche, String(p.homme), String(p.femme)])] } },
      ],
      styles: { titre: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] }, soustitre: { fontSize: 12, bold: true, margin: [0, 12, 0, 4] } },
      defaultStyle: { fontSize: 10 },
    });
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.getBuffer((b: Buffer, err?: unknown) => (err ? reject(err) : resolve(b)));
    });
    await this.audit.log({ compteId: user.compteId, action: 'EXPORT', entite: 'Rapport', details: {} });
    return { buffer, nom: 'rapport_effectifs.pdf' };
  }
}