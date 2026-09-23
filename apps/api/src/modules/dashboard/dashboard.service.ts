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

  /** Répartition hommes / femmes (camembert du CDC §2.3). */
  async genres(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const e = await this.effectifsPar({ ...ou, deletedAt: null });
    return [
      { sexe: 'M', effectif: e.genres.homme },
      { sexe: 'F', effectif: e.genres.femme },
    ];
  }

  /** Camembert par catégorie de grades (CDC §2.3). */
  async repartitionCategories(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const e = await this.effectifsPar({ ...ou, deletedAt: null });
    return Object.entries(e.cat)
      .map(([categorie, effectif]) => ({ categorie, effectif }))
      .sort((a, b) => b.effectif - a.effectif);
  }

  /** Prévision des départs à la retraite par année (date fin de lien). */
  async retraitesParAnnee(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const rows = await this.prisma.personnel.findMany({
      where: { ...ou, deletedAt: null },
      select: { dateNaissance: true, grade: { select: { ageDepartRetraite: true } } },
    });
    const parAnnee: Record<number, number> = {};
    for (const r of rows) {
      if (!r.dateNaissance || !r.grade?.ageDepartRetraite) continue;
      const dateFin = new Date(r.dateNaissance);
      dateFin.setFullYear(dateFin.getFullYear() + r.grade.ageDepartRetraite);
      const annee = dateFin.getFullYear();
      parAnnee[annee] = (parAnnee[annee] ?? 0) + 1;
    }
    const courante = new Date().getFullYear();
    const debut = courante - 3;
    const fin = courante + 7;
    return Array.from({ length: fin - debut + 1 }, (_, i) => {
      const annee = debut + i;
      return { annee, effectif: parAnnee[annee] ?? 0 };
    });
  }

  /** Camembert par base avec 2ᵉ niveau (perçage) par unité — CDC §2.3 « camembert
   *  par base + camembert par unité ». */
  async parBaseHierarchique(user: RequestUser): Promise<unknown[]> {
    const ou = await this.where(user);
    const rows = await this.prisma.personnel.groupBy({
      by: ['uniteId'],
      where: { ...ou, deletedAt: null },
      _count: { _all: true },
    });
    const unites = await this.prisma.unite.findMany({
      where: { id: { in: rows.map((r) => r.uniteId) } },
      include: { base: true },
      orderBy: { ordre: 'asc' },
    });
    const parBase: Record<string, { baseId: string; base: string; effectif: number; unites: Array<Record<string, unknown>> }> = {};
    // On groupe d'abord par base (ordre alphabétique stable), puis par unité.
    const unitesTriees = [...unites].sort((a, b) => a.base.nom.localeCompare(b.base.nom) || a.ordre - b.ordre);
    for (const u of unitesTriees) {
      const effectif = (rows.find((r) => r.uniteId === u.id)?._count as unknown as { _all?: number })?._all ?? 0;
      if (effectif === 0) continue;
      const groupe = (parBase[u.baseId] ??= { baseId: u.baseId, base: u.base.nom, effectif: 0, unites: [] });
      groupe.effectif += effectif;
      groupe.unites.push({ uniteId: u.id, unite: u.nom, effectif });
    }
    return Object.values(parBase).sort((a, b) => a.base.localeCompare(b.base));
  }

  /** Comparaison d'une base/unité par rapport à l'ensemble — CDC §2.3. */
  async comparaison(user: RequestUser, uniteId?: string, baseId?: string): Promise<unknown> {
    const ou = await this.where(user);
    const ensemble = await this.effectifsPar({ ...ou, deletedAt: null });

    let filtre: Prisma.PersonnelWhereInput;
    let libelle: string;
    if (uniteId) {
      filtre = { ...ou, deletedAt: null, uniteId };
      const unite = await this.prisma.unite.findUnique({
        where: { id: uniteId },
        include: { base: true },
      });
      libelle = unite ? `${unite.base.nom} — ${unite.nom}` : `Unité ${uniteId}`;
    } else if (baseId) {
      filtre = { ...ou, deletedAt: null, unite: { baseId } };
      const base = await this.prisma.base.findUnique({ where: { id: baseId } });
      libelle = base?.nom ?? `Base ${baseId}`;
    } else {
      throw new Error('comparaison requiert uniteId ou baseId');
    }

    const selection = await this.effectifsPar(filtre);
    return { selection: { libelle, ...selection }, ensemble };
  }

  /** Agrégats (catégories, spécialités, genres) depuis un filtre Prisma. */
  private async effectifsPar(
    filtre: Prisma.PersonnelWhereInput,
  ): Promise<{ cat: Record<string, number>; spe: Record<string, number>; genres: { homme: number; femme: number } }> {
    const rows = await this.prisma.personnel.findMany({
      where: filtre,
      select: {
        sexe: true,
        grade: { select: { categorie: true } },
        specialite: { select: { libelle: true } },
      },
    });
    const cat: Record<string, number> = {};
    const spe: Record<string, number> = {};
    let homme = 0;
    let femme = 0;
    for (const r of rows) {
      const c = r.grade?.categorie ?? 'AUTRE';
      cat[c] = (cat[c] ?? 0) + 1;
      const s = r.specialite?.libelle ?? 'Non renseignée';
      spe[s] = (spe[s] ?? 0) + 1;
      if (r.sexe === 'F') femme += 1;
      else if (r.sexe === 'M') homme += 1;
    }
    return { cat, spe, genres: { homme, femme } };
  }
}