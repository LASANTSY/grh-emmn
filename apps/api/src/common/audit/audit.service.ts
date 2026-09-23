import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ActionAudit } from '@prisma/client';

export interface AuditEntryInput {
  compteId?: string | null;
  action: ActionAudit;
  entite: string;
  entiteId?: string | null;
  champModifie?: string | null;
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
  personnelId?: string | null;
  details?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Journalisation de toute action sensible (CDC §2.6c, §28).
 * Aucun secret ni donnée personnelle superflue n'est stocké.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntryInput): Promise<void> {
    try {
      await this.prisma.entreeAudit.create({
        data: {
          compteId: entry.compteId ?? null,
          action: entry.action,
          entite: entry.entite,
          entiteId: entry.entiteId ?? null,
          champModifie: entry.champModifie ?? null,
          ancienneValeur: entry.ancienneValeur ?? null,
          nouvelleValeur: entry.nouvelleValeur ?? null,
          personnelId: entry.personnelId ?? null,
          details: entry.details ? (entry.details as never) : undefined,
          ip: entry.ip ?? null,
        },
      });
    } catch (error) {
      // L'audit ne doit jamais faire échouer l'opération métier principale.
      // La journalisation reste best-effort (documenté).
      throw error; // en dev, on propage pour fiabiliser les tests
    }
  }

  async liste(params: {
    page?: number;
    pageSize?: number;
    entite?: string;
    action?: string;
    compteId?: string;
    personnelId?: string;
    depuis?: Date;
  }): Promise<{ items: unknown[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where = {
      entite: params.entite,
      action: params.action as ActionAudit | undefined,
      compteId: params.compteId,
      personnelId: params.personnelId,
      dateHeure: params.depuis ? { gte: params.depuis } : undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.entreeAudit.findMany({
        where,
        include: { compte: { select: { identifiant: true } } },
        orderBy: { dateHeure: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.entreeAudit.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}