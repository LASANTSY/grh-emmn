import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import { normaliserDates, CHAMPS_DATE_ONGLET } from '../../common/util/dates';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

/**
 * Gestion des sous-ressources liées à une fiche (onglets 2 à 7).
 * Chaque ajout APPEND l'historique : aucun enregistrement n'est écrasé.
 * La suppression d'une ligne reste explicitement actionnable (action
 * destructive confirmée côté interface).
 */
@Injectable()
export class PersonnelOngletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  private async securiser(personnelId: string, user: RequestUser): Promise<void> {
    const p = await this.prisma.personnel.findUnique({
      where: { id: personnelId },
      select: { id: true, uniteId: true, deletedAt: true },
    });
    if (!p || p.deletedAt) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    await this.scope.verifierLecture(user, p);
  }

  private auditer(
    compteId: string,
    action: 'CREATION' | 'MODIFICATION' | 'SUPPRESSION',
    entite: string,
    personnelId: string,
    nouvelleValeur?: string,
  ) {
    return this.audit.log({
      compteId,
      action,
      entite,
      entiteId: personnelId,
      personnelId,
      nouvelleValeur,
      ip: null,
    });
  }

  async creerRelation(
    personnelId: string,
    model: 'enfant' | 'historiqueGrade' | 'cursusScolaire' | 'stageMilitaire' |
           'competenceLinguistique' | 'affectation' | 'decoration',
    donnees: Record<string, unknown>,
    user: RequestUser,
  ): Promise<unknown> {
    await this.securiser(personnelId, user);
    this.scope.verifierEcriture(user);
    const data = normaliserDates(donnees, CHAMPS_DATE_ONGLET[model] ?? []);
    try {
      const cree = await (this.prisma[model] as unknown as PrismaClientDelegate).create({
        data: { ...data, personnelId },
      } as never);
      await this.auditer(user.compteId, 'CREATION', 'Personnel', personnelId);
      return cree;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppError.conflict(
          'DUPLICATE_VALUE',
          'Cette compétence linguistique existe déjà pour ce dossier.',
        );
      }
      throw error;
    }
  }

  async modifierRelation(
    personnelId: string,
    id: string,
    model: 'enfant' | 'historiqueGrade' | 'cursusScolaire' | 'stageMilitaire' |
           'competenceLinguistique' | 'affectation' | 'decoration',
    donnees: Record<string, unknown>,
    user: RequestUser,
  ): Promise<unknown> {
    await this.securiser(personnelId, user);
    this.scope.verifierEcriture(user);
    const existant = await (this.prisma[model] as unknown as PrismaClientDelegate).findUnique({
      where: { id },
    });
    if (!existant || existant.personnelId !== personnelId) {
      throw AppError.notFound('RESSOURCE_NOT_FOUND', 'Élément introuvable pour ce dossier.');
    }
    const maj = await (this.prisma[model] as unknown as PrismaClientDelegate).update({
      where: { id },
      data: normaliserDates(donnees, CHAMPS_DATE_ONGLET[model] ?? []),
    });
    await this.auditer(user.compteId, 'MODIFICATION', 'Personnel', personnelId);
    return maj;
  }

  async supprimerRelation(
    personnelId: string,
    id: string,
    model: 'enfant' | 'historiqueGrade' | 'cursusScolaire' | 'stageMilitaire' |
           'competenceLinguistique' | 'affectation' | 'decoration',
    user: RequestUser,
  ): Promise<void> {
    await this.securiser(personnelId, user);
    this.scope.verifierEcriture(user);
    const existant = await (this.prisma[model] as unknown as PrismaClientDelegate).findUnique({
      where: { id },
    });
    if (!existant || existant.personnelId !== personnelId) {
      throw AppError.notFound('RESSOURCE_NOT_FOUND', 'Élément introuvable pour ce dossier.');
    }
    await (this.prisma[model] as unknown as PrismaClientDelegate).delete({ where: { id } });
    await this.auditer(user.compteId, 'SUPPRESSION', 'Personnel', personnelId);
  }
}

// Type helper minimal (le delegate Prisma expose create/update/delete/findUnique).
type PrismaClientDelegate = {
  create(args: never): Promise<{ personnelId: string }>;
  update(args: { where: { id: string }; data: unknown }): Promise<{ personnelId: string }>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  findUnique(args: { where: { id: string } }): Promise<{ id: string; personnelId: string } | null>;
};