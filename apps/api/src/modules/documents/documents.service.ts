import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import { StorageService } from '../../common/storage/storage.interface';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

interface FichierUpload {
  buffer: Buffer;
  originalname: string;
  mimeType: string;
}

@Injectable()
export class DocumentsService {
  private readonly maxTailleOctets: number;
  private readonly mimesAutorises: Set<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    const maxMb = this.config.get<number>('MAX_FILE_SIZE_MB') ?? 20;
    this.maxTailleOctets = maxMb * 1024 * 1024;
    const mimes = (this.config.get<string>('ALLOWED_MIME') ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    this.mimesAutorises = new Set(
      mimes.length > 0
        ? mimes
        : ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    );
  }

  private verifierFichier(fichier: FichierUpload): void {
    if (!fichier || !fichier.buffer) {
      throw AppError.conflict('FICHIER_MANQUANT', 'Aucun fichier envoyé.');
    }
    if (fichier.buffer.length > this.maxTailleOctets) {
      throw AppError.conflict(
        'FICHIER_TROP_GRAND',
        `Le fichier dépasse la taille maximale de ${this.maxTailleOctets / 1024 / 1024} Mo.`,
      );
    }
    if (!this.mimesAutorises.has(fichier.mimeType)) {
      throw AppError.conflict(
        'TYPE_FICHIER_NON_AUTORISE',
        'Type de fichier non autorisé (PDF, JPG/PNG, DOC/DOCX).',
      );
    }
  }

  private async securiser(personnelId: string, user: RequestUser, besoinEcriture: boolean) {
    const p = await this.prisma.personnel.findUnique({
      where: { id: personnelId },
      select: { id: true, uniteId: true, deletedAt: true },
    });
    if (!p || p.deletedAt) throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    await this.scope.verifierLecture(user, p);
    if (besoinEcriture && user.typeCompte !== 'PERSONNEL') {
      this.scope.verifierEcriture(user);
    }
    return p;
  }

  async uploader(
    personnelId: string,
    type: string,
    fichier: FichierUpload,
    user: RequestUser,
  ): Promise<unknown> {
    await this.securiser(personnelId, user, true);
    this.verifierFichier(fichier);

    const stocke = await this.storage.put({
      buffer: fichier.buffer,
      originalname: fichier.originalname,
      mimeType: fichier.mimeType,
      folder: `personnel/${personnelId}`,
    });
    const nomOriginal = fichier.originalname.slice(0, 300);
    const pj = await this.prisma.pieceJointe.create({
      data: {
        personnelId,
        type,
        dateAjout: new Date(),
        versions: {
          create: {
            fichier: stocke.key,
            format: fichier.mimeType.split('/')[1] ?? 'bin',
            tailleOctets: fichier.buffer.length,
            nomOriginal,
            mimeType: fichier.mimeType,
            deposeParId: user.compteId,
          },
        },
      },
      include: { versions: { orderBy: { dateDepot: 'desc' } } },
    });
    await this.audit.log({
      compteId: user.compteId,
      action: 'TELEVERSEMENT',
      entite: 'PieceJointe',
      entiteId: pj.id,
      personnelId,
      nouvelleValeur: nomOriginal,
    });
    return pj;
  }

  async lister(personnelId: string, user: RequestUser): Promise<unknown> {
    await this.securiser(personnelId, user, false);
    return this.prisma.pieceJointe.findMany({
      where: { personnelId },
      orderBy: { dateAjout: 'desc' },
      include: { versions: { orderBy: { dateDepot: 'desc' } } },
    });
  }

  async telecharger(id: string, user: RequestUser, apercu: boolean): Promise<{
    buffer: Buffer;
    nomOriginal: string;
    mimeType: string;
  }> {
    const pj = await this.prisma.pieceJointe.findUnique({
      where: { id },
      include: { personnel: { select: { id: true, uniteId: true, deletedAt: true } }, versions: { orderBy: { dateDepot: 'desc' } } },
    });
    if (!pj || pj.versions.length === 0) {
      throw AppError.notFound('PIECE_JOINTE_NOT_FOUND', 'Pièce jointe introuvable.');
    }
    await this.scope.verifierLecture(user, pj.personnel);
    const version = pj.versions[0];
    const buffer = await this.storage.get(version.fichier);
    const _ = apercu;
    await this.audit.log({
      compteId: user.compteId,
      action: 'TELECHARGEMENT',
      entite: 'PieceJointe',
      entiteId: pj.id,
      personnelId: pj.personnelId,
      details: { apercu },
      ip: null,
    });
    return { buffer, nomOriginal: version.nomOriginal, mimeType: version.mimeType };
  }

  /** Télécharger / prévisualiser une version précise (historique §2.2j). */
  async telechargerVersion(versionId: string, user: RequestUser, apercu: boolean): Promise<{
    buffer: Buffer;
    nomOriginal: string;
    mimeType: string;
  }> {
    const version = await this.prisma.versionPieceJointe.findUnique({
      where: { id: versionId },
      include: {
        pieceJointe: {
          select: {
            id: true,
            personnelId: true,
            personnel: { select: { id: true, uniteId: true, deletedAt: true } },
          },
        },
      },
    });
    if (!version) throw AppError.notFound('VERSION_NOT_FOUND', 'Version de pièce jointe introuvable.');
    await this.scope.verifierLecture(user, version.pieceJointe.personnel);
    const buffer = await this.storage.get(version.fichier);
    await this.audit.log({
      compteId: user.compteId,
      action: 'TELECHARGEMENT',
      entite: 'PieceJointe',
      entiteId: version.pieceJointe.id,
      personnelId: version.pieceJointe.personnelId,
      details: { apercu, version: versionId },
      ip: null,
    });
    return { buffer, nomOriginal: version.nomOriginal, mimeType: version.mimeType };
  }

  async ajouterVersion(id: string, fichier: FichierUpload, user: RequestUser): Promise<unknown> {
    await this.securiser(
      (await this.prisma.pieceJointe.findUnique({ where: { id } }))?.personnelId ?? '',
      user,
      true,
    );
    this.verifierFichier(fichier);
    const pj = await this.prisma.pieceJointe.findUnique({ where: { id } });
    if (!pj) throw AppError.notFound('PIECE_JOINTE_NOT_FOUND', 'Pièce jointe introuvable.');

    const stocke = await this.storage.put({
      buffer: fichier.buffer,
      originalname: fichier.originalname,
      mimeType: fichier.mimeType,
      folder: `personnel/${pj.personnelId}`,
    });
    const version = await this.prisma.versionPieceJointe.create({
      data: {
        pieceJointeId: pj.id,
        fichier: stocke.key,
        format: fichier.mimeType.split('/')[1] ?? 'bin',
        tailleOctets: fichier.buffer.length,
        nomOriginal: fichier.originalname.slice(0, 300),
        mimeType: fichier.mimeType,
        deposeParId: user.compteId,
      },
    });
    await this.audit.log({
      compteId: user.compteId,
      action: 'MODIFICATION',
      entite: 'PieceJointe',
      entiteId: pj.id,
      personnelId: pj.personnelId,
      champModifie: 'version',
    });
    return version;
  }

  async supprimer(id: string, user: RequestUser): Promise<void> {
    this.scope.verifierEcriture(user);
    const pj = await this.prisma.pieceJointe.findUnique({
      where: { id },
      include: { personnel: { select: { id: true, uniteId: true, deletedAt: true } } },
    });
    if (!pj) throw AppError.notFound('PIECE_JOINTE_NOT_FOUND', 'Pièce jointe introuvable.');
    await this.scope.verifierLecture(user, pj.personnel);

    const versions = await this.prisma.versionPieceJointe.findMany({ where: { pieceJointeId: id } });
    for (const v of versions) {
      await this.storage.remove(v.fichier).catch(() => undefined);
    }
    await this.prisma.pieceJointe.delete({ where: { id } });
    await this.audit.log({
      compteId: user.compteId,
      action: 'SUPPRESSION',
      entite: 'PieceJointe',
      entiteId: id,
      personnelId: pj.personnelId,
      ip: null,
    });
  }
}