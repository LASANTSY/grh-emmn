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