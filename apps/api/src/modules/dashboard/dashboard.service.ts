import { Injectable } from '@nestjs/common';
import { Prisma, type GradeCategorie } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

const CATEGORIES_OFFICIERS = ['OFFICIER_GENERAL', 'OFFICIER_MARINE', 'OFFICIER_MARINIER'] as GradeCategorie[];
const TOUTES_CATEGORIES = [...CATEGORIES_OFFICIERS, 'QMO'] as GradeCategorie[];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  private async where(user: RequestUser): Promise<Prisma.PersonnelWhereInput> {
    const { baseIds } = await this.scope.perimetre(user);
    return baseIds === 'TOUTES'
      ? {}
      : { unite: { baseId: { in: baseIds } } };
  }

  async synthèse(user: RequestUser): Promise<Record<string, number>> {
    const ou = await this.where(user);
    const [effectif, officiers, qmo, autres, recrutesAnnee] = await Promise.all([
      this.prisma.personnel.count({ where: { ...ou, deletedAt: null } }),
      this.prisma.personnel.count({
        where: { ...ou, deletedAt: null, grade: { categorie: { in: CATEGORIES_OFFICIERS } } },
      }),
      this.prisma.personnel.count({ where: { ...ou, deletedAt: null, grade: { categorie: 'QMO' } } }),
      this.prisma.personnel.count({
        where: { ...ou, deletedAt: null, NOT: { grade: { categorie: { in: TOUTES_CATEGORIES } } } },
      }),
      this.prisma.personnel.count({
        where: {
          ...ou,
          deletedAt: null,
          dateEntreeService: { gte: new Date(`${new Date().getFullYear()}-01-01`) },
        },
      }),
    ]);
    return { effectif, officiers, qmo, autres, recrutesAnnee };
  }

  async repartition(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const rows = await this.prisma.personnel.groupBy({
      by: ['gradeId'],
      where: { ...ou, deletedAt: null },
      _count: { _all: true },
    });
    const grades = await this.prisma.grade.findMany({
      where: { id: { in: rows.map((r) => r.gradeId) } },
    });
    return rows
      .map((r) => ({
        grade: grades.find((g) => g.id === r.gradeId)?.libelle ?? r.gradeId,
        categorie: grades.find((g) => g.id === r.gradeId)?.categorie ?? null,
        effectif: (r._count as { _all?: number })._all ?? 0,
      }))
      .sort((a, b) => b.effectif - a.effectif);
  }

  async parBase(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const rows = await this.prisma.personnel.groupBy({
      by: ['uniteId'],
      where: { ...ou, deletedAt: null },
      _count: { _all: true },
    });
    const unites = await this.prisma.unite.findMany({
      where: { id: { in: rows.map((r) => r.uniteId) } },
      include: { base: true },
    });
    return rows
      .map((r) => {
        const u = unites.find((x) => x.id === r.uniteId);
        return { base: u?.base.nom ?? '—', unite: u?.nom ?? r.uniteId, effectif: (r._count as { _all?: number })._all ?? 0 };
      })
      .sort((a, b) => b.effectif - a.effectif);
  }

  async pyramideAges(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const personnels = await this.prisma.personnel.findMany({
      where: { ...ou, deletedAt: null },
      select: { sexe: true, dateNaissance: true },
    });
    const annee = new Date().getFullYear();
    const tranches: Record<string, { homme: number; femme: number }> = {};
    for (const p of personnels) {
      if (!p.dateNaissance) continue;
      const age = annee - p.dateNaissance.getFullYear();
      const tranche = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;
      tranches[tranche] ??= { homme: 0, femme: 0 };
      tranches[tranche][p.sexe === 'F' ? 'femme' : 'homme'] += 1;
    }
    return Object.entries(tranches)
      .map(([tranche, v]) => ({ tranche, ...v }))
      .sort((a, b) => a.tranche.localeCompare(b.tranche, undefined, { numeric: true }));
  }

  async evolutionRecrutements(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const rows = await this.prisma.personnel.groupBy({
      by: ['dateEntreeService'],
      where: { ...ou, deletedAt: null },
      _count: { _all: true },
    });
    const parAnnee: Record<string, number> = {};
    for (const r of rows) {
      if (!r.dateEntreeService) continue;
      const annee = r.dateEntreeService.getFullYear();
      const count = (r._count as { _all?: number })._all ?? 0;
      parAnnee[annee] = (parAnnee[annee] ?? 0) + count;
    }
    const anneeCourante = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const annee = anneeCourante - 9 + i;
      return { annee, effectif: parAnnee[annee] ?? 0 };
    });
  }
}