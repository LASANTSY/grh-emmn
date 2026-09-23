import { Injectable } from '@nestjs/common';
import { Personnel, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

/**
 * Contrôle du périmètre organisationnel (RBAC) — la seule sécurité réelle.
 * - GLOBAL  : aucun filtre d'unité.
 * - BASE    : restreint aux unités d'une base.
 * - UNITE   : restreint à une unité.
 * - SOI     : la fiche de l'utilisateur lui-même (lecture).
 */
@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Filtre Prisma à appliquer sur les requêtes Personnel (liste). */
  filtrePersonnel(user: RequestUser): Prisma.PersonnelWhereInput {
    switch (user.perimetre.type) {
      case 'GLOBAL':
        return {};
      case 'BASE':
        return {
          unite: { baseId: user.perimetre.baseId ?? '__NA' },
        };
      case 'UNITE':
        return { uniteId: user.perimetre.uniteId ?? '__NA' };
      case 'SOI':
        return { id: user.personnelId };
      default:
        return {};
    }
  }

  /** Vérifie qu'un personnel est dans le périmètre de lecture du compte. */
  async verifierLecture(user: RequestUser, personnel: Pick<Personnel, 'id' | 'uniteId'>): Promise<void> {
    if (user.perimetre.type === 'GLOBAL') return;
    if (user.perimetre.type === 'SOI') {
      if (user.personnelId !== personnel.id) {
        throw AppError.forbidden('PERIMETRE_RESTREINT', "Accès limité à votre propre dossier.");
      }
      return;
    }

    const unite = await this.prisma.unite.findUnique({ where: { id: personnel.uniteId } });
    if (!unite) {
      throw AppError.notFound('UNITE_NOT_FOUND', 'Unité introuvable.');
    }
    const dansPerimetre =
      user.perimetre.type === 'BASE'
        ? unite.baseId === user.perimetre.baseId
        : unite.id === user.perimetre.uniteId;

    if (!dansPerimetre) {
      throw AppError.forbidden('PERIMETRE_RESTREINT', "Ce dossier est hors de votre périmètre.");
    }
  }

  /** Vérifie le droit d'écriture sur un personnel (édition, suppression...). */
  verifierEcriture(user: RequestUser): void {
    if (user.perimetre.type === 'SOI') {
      throw AppError.forbidden(
        'PERMISSION_DENIED',
        "Votre compte vous permet uniquement de proposer des modifications.",
      );
    }
  }

  /**
   * Renvoie la liste des IDs de base couverte par le périmètre du compte
   * ('TOUTES' pour un périmètre global). Utilisé par les agrégats, l'audit
   * et les demandes de modification.
   */
  async perimetre(user: RequestUser): Promise<{ baseIds: string[] | 'TOUTES' }> {
    if (user.perimetre.type === 'GLOBAL') return { baseIds: 'TOUTES' };
    if (user.perimetre.type === 'BASE' && user.perimetre.baseId) {
      return { baseIds: [user.perimetre.baseId] };
    }
    let uniteId = user.perimetre.uniteId ?? null;
    if (user.perimetre.type === 'SOI') {
      const personnel = await this.prisma.personnel.findUnique({
        where: { id: user.personnelId },
        select: { uniteId: true },
      });
      uniteId = personnel?.uniteId ?? null;
    }
    if (!uniteId) return { baseIds: [] };
    const unite = await this.prisma.unite.findUnique({ where: { id: uniteId } });
    if (!unite) return { baseIds: [] };
    return { baseIds: [unite.baseId] };
  }
}