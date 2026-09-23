import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import { StorageService } from '../../common/storage/storage.interface';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

export const ENTETES = <const>[
  'Matricule', 'Corps', 'CIN', 'Nom', 'Prénoms', 'Date de naissance', 'Lieu de naissance', 'Sexe',
  'Situation familiale', 'Adresse', 'Email', 'Téléphone', 'Corps armée', 'Date de recrutement',
  'Autorité de recrutement', 'Date engagement', 'CIR n°/date', 'Résidence', 'Secteur', 'Enfant(s)',
];

function valeur(cellule: ExcelJS.CellValue | undefined): string {
  if (cellule === undefined || cellule === null) return '';
  if (cellule instanceof Date) return cellule.toISOString().slice(0, 10);
  if (typeof cellule === 'object' && 'result' in cellule && cellule.result !== undefined) {
    return String(cellule.result);
  }
  return String(cellule).trim();
}

function valeurDate(texte: string): Date | null {
  const t = texte.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface LigneParse {
  numeroLigne: number;
  erreurs: string[];
  apercu: Record<string, string>;
  donnees: Record<string, string>;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async gabarit(): Promise<{ buffer: Buffer; nom: string }> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Personnel');
    ws.columns = ENTETES.map((h) => ({ header: h, width: 22 }));
    ws.addRow(ENTETES.map(() => ''));
    ws.getRow(1).font = { bold: true };
    ws.addRow(['MSA/2020/001', 'Officier', '1010200300400', 'RAZAFIMANDIMBY', 'Harilala Jean', '1990-05-14', 'Antananarivo', 'M', 'Célibataire', 'Antananarivo', 'harilala@emm.mg', '+261 32 00 000 00', 'Marine', '2015-01-10', 'EMD', '2015-01-10', '000210, 2015-01-10', 'Antananarivo', '—', '0']);
    ws.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + ENTETES.length)}1` };
    const buffer = await wb.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), nom: 'gabarit_import_personnel.xlsx' };
  }

  private async parser(buffer: Buffer): Promise<LigneParse[]> {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as never);
    } catch {
      throw AppError.conflict('FICHIER_INVALIDE', 'Impossible de lire le fichier Excel.');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw AppError.conflict('FICHIER_INVALIDE', 'Aucune feuille dans le fichier.');

    const libellesGrade = new Set((await this.prisma.grade.findMany({ select: { libelle: true } })).map((g) => g.libelle));

    const resultats: LigneParse[] = [];
    ws.eachRow((row, numeroLigne) => {
      if (numeroLigne === 1) return;
      const get = (i: number) => valeur(row.getCell(i).value);
      const donnees: Record<string, string> = {
        matricule: get(1), corps: get(2), cin: get(3), nom: get(4), prenoms: get(5),
        dateNaissance: get(6), lieuNaissance: get(7), sexe: get(8), situationFamiliale: get(9),
        adresse: get(10), email: get(11), telephone: get(12), corpsArmee: get(13),
        dateRecrutement: get(14), autoriteRecrutement: get(15), dateEngagement: get(16),
        cir: get(17), residence: get(18), secteur: get(19), enfants: get(20),
      };
      const erreurs: string[] = [];
      if (donnees.matricule.length < 3) erreurs.push('Matricule manquant ou trop court.');
      if (!donnees.nom) erreurs.push('Nom manquant.');
      if (!donnees.prenoms) erreurs.push('Prénoms manquants.');
      if (!valeurDate(donnees.dateNaissance)) erreurs.push('Date de naissance invalide (attendu AAAA-MM-JJ).');
      if (donnees.sexe && !['M', 'F', 'A'].includes(donnees.sexe.toUpperCase())) erreurs.push('Sexe invalide (M, F ou A).');
      if (donnees.corps && !libellesGrade.has(donnees.corps)) erreurs.push('Grade/Corps inconnu dans le référentiel.');

      resultats.push({
        numeroLigne,
        erreurs: [...new Set(erreurs)],
        apercu: { numeroLigne: String(numeroLigne), matricule: donnees.matricule, nom: donnees.nom, prenoms: donnees.prenoms, dateNaissance: donnees.dateNaissance },
        donnees,
      });
    });
    return resultats;
  }

  async analyser(
    buffer: Buffer,
    nomFichier: string,
    user: RequestUser,
  ): Promise<{
    importId: string;
    total: number;
    valides: number;
    avecErreurs: number;
    lignes: Array<{ numeroLigne: number; erreursGroupees: string[]; apercu: Record<string, string> }>;
  }> {
    const lignes = await this.parser(buffer);
    const { key: cleFichier } = await this.storage.put({
      buffer,
      originalname: nomFichier,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folder: 'imports',
    });

    const importe = await this.prisma.importPersonnel.create({
      data: {
        compteId: user.compteId,
        nomFichierSource: nomFichier.slice(0, 300),
        fichierStocke: cleFichier,
        nombreLignes: lignes.length,
        statut: 'PREVUE',
      },
    });

    return {
      importId: importe.id,
      total: lignes.length,
      valides: lignes.filter((l) => l.erreurs.length === 0).length,
      avecErreurs: lignes.filter((l) => l.erreurs.length > 0).length,
      lignes: lignes.map((l) => ({ numeroLigne: l.numeroLigne, erreursGroupees: l.erreurs, apercu: l.apercu })),
    };
  }

  async confirmer(importId: string, user: RequestUser): Promise<{
    importe: number; doublons: number; ignores: number; errones: number; partiel: boolean;
  }> {
    const imp = await this.prisma.importPersonnel.findUnique({ where: { id: importId } });
    if (!imp) throw AppError.notFound('IMPORT_NOT_FOUND', 'Import introuvable.');
    if (imp.statut !== 'PREVUE') {
      throw AppError.conflict('IMPORT_DEJA_VALIDE', 'Cet import a déjà été traité.');
    }
    if (!imp.fichierStocke) throw AppError.conflict('IMPORT_SOURCE_MANQUANTE', 'Le fichier source n’est pas disponible.');

    let buffer: Buffer;
    try {
      buffer = await this.storage.get(imp.fichierStocke);
    } catch {
      throw AppError.conflict('IMPORT_SOURCE_MANQUANTE', 'Le fichier source de cet import n’est plus disponible.');
    }
    const lignes = await this.parser(buffer);

    const grades = await this.prisma.grade.findMany({ select: { id: true, libelle: true } });
    const gradeParLibelle = new Map(grades.map((g) => [g.libelle, g.id]));
    const uniteDefaut = await this.prisma.unite.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!uniteDefaut) throw AppError.conflict('REFERENTIEL_INCOMPLET', 'Aucune unité référentielle disponible.');

    let importe = 0;
    let doublons = 0;
    let ignores = 0;
    let errones = 0;

    const resultat = await this.prisma.$transaction(async (tx) => {
      for (const ligne of lignes) {
        const { numeroLigne, erreurs, donnees } = ligne;
        if (erreurs.length > 0) {
          errones += 1;
          await tx.ligneImport.create({ data: { importPersonnelId: importId, numeroLigne, statut: 'ERREUR', actionAppliquee: 'ERREUR', messageErreur: erreurs.join(' ; '), donnees } });
          continue;
        }
        const dejaExistant = await tx.personnel.findFirst({ where: { matriculeRecrutement: donnees.matricule, deletedAt: null }, select: { id: true } });
        if (dejaExistant) {
          doublons += 1;
          await tx.ligneImport.create({ data: { importPersonnelId: importId, numeroLigne, statut: 'ERREUR', actionAppliquee: 'MISE_A_JOUR', messageErreur: 'Matricule déjà présent dans la base (mise à jour non appliquée).', personnelId: dejaExistant.id, donnees } });
          continue;
        }
        const gradeId = gradeParLibelle.get(donnees.corps);
        if (!gradeId) {
          ignores += 1;
          await tx.ligneImport.create({ data: { importPersonnelId: importId, numeroLigne, statut: 'ERREUR', actionAppliquee: 'ERREUR', messageErreur: 'Grade introuvable.', donnees } });
          continue;
        }
        const nouveau = await tx.personnel.create({
          data: {
            matriculeRecrutement: donnees.matricule,
            nom: donnees.nom,
            prenoms: donnees.prenoms,
            dateNaissance: valeurDate(donnees.dateNaissance),
            sexe: (donnees.sexe.toUpperCase() || 'A') as 'M' | 'F' | 'A',
            gradeId,
            uniteId: uniteDefaut.id,
            statutFamilial: donnees.situationFamiliale || null,
            adresseActuelle: donnees.adresse || null,
          },
        });
        await tx.ligneImport.create({ data: { importPersonnelId: importId, numeroLigne, statut: 'VALIDE', actionAppliquee: 'CREATION', personnelId: nouveau.id, donnees } });
        importe += 1;
      }

      const statut = importe === 0 ? 'REJETEE' : ignores + errones > 0 || doublons > 0 ? 'PARTIELLE' : 'IMPORTEE';
      await tx.importPersonnel.update({
        where: { id: importId },
        data: { statut, nombreCrees: importe, nombreErrors: errones + ignores, nombreMisesAJour: doublons },
      });
      return { importe, doublons, ignores, errones, partiel: statut === 'PARTIELLE' };
    });

    await this.audit.log({
      compteId: user.compteId, action: 'IMPORT', entite: 'ImportPersonnel',
      entiteId: importId, details: resultat,
    });
    return resultat;
  }

  async historique(): Promise<unknown[]> {
    return this.prisma.importPersonnel.findMany({
      orderBy: { dateImport: 'desc' },
      include: {
        compte: { select: { identifiant: true } },
        _count: { select: { lignes: true } },
      },
    });
  }
}