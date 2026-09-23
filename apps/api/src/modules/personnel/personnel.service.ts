import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { calculerFinDeLien } from '@grh/config';
import { normaliserDates, CHAMPS_DATE_PERSONNEL } from '../../common/util/dates';
import type { PersonnelInput } from '@grh/validation';

// ---------------------------------------------------------------------------
// Parties réutilisées
// ---------------------------------------------------------------------------

export const detailInclude = {
  grade: true,
  unite: { include: { base: true } },
  specialite: true,
  enfants: { orderBy: { rang: 'asc' as const } },
  historiqueGrades: {
    orderBy: { datePriseCommandement: 'desc' as const },
    include: { grade: true },
  },
  cursusScolaire: { orderBy: { dateDebut: 'desc' as const } },
  stagesMilitaires: { orderBy: { dateDebut: 'desc' as const } },
  competencesLinguistiques: { orderBy: { langue: 'asc' as const } },
  affectations: {
    orderBy: { dateEffet: 'desc' as const },
    include: { unite: true },
  },
  decorations: { orderBy: { dateEffet: 'desc' as const } },
  piecesJointes: {
    orderBy: { dateAjout: 'desc' as const },
    include: {
      versions: { orderBy: { dateDepot: 'desc' as const } },
    },
  },
  compte: { select: { id: true, identifiant: true, typeCompte: true, actif: true } },
} satisfies Prisma.PersonnelInclude;

export const listeInclude = {
  grade: true,
  unite: { include: { base: true } },
  specialite: true,
} satisfies Prisma.PersonnelInclude;

const TRIBASIQUE = new Set([
  'nom', 'prenoms', 'matriculeRecrutement', 'matriculeFinancier', 'numeroCIN',
  'email', 'telephoneMobile', 'lieuNaissance', 'corps', 'fonctionActuelle',
  'lieuEmploi', 'numeroPasseport', 'numeroCIM', 'niveauInstruction',
]);

type TriPersonnel =
  | 'nom'
  | 'matriculeRecrutement'
  | 'dateNaissance'
  | 'dateEntreeService'
  | 'categorie'
  | 'unite';

export interface RechercheParams {
  q?: string;
  nom?: string;
  matricule?: string;
  gradeId?: string;
  uniteId?: string;
  baseId?: string;
  specialiteId?: string;
  categorie?: string;
  situationMilitaire?: string;
  corps?: string;
  finDeLien?: 'DANS_1_AN' | 'DANS_2_ANS' | 'RETRAITE';
  page?: number;
  pageSize?: number;
  tri?: TriPersonnel;
  ordre?: 'asc' | 'desc';
}

@Injectable()
export class PersonnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  // -------------------------------------------------------------------------
  // Recherche / liste (pagination serveur, filtres combinables)
  // -------------------------------------------------------------------------
  async rechercher(user: RequestUser, params: RechercheParams): Promise<unknown> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(params.pageSize) || 20));
    const scopeWhere = this.scope.filtrePersonnel(user);

    const where: Prisma.PersonnelWhereInput = {
      deletedAt: null,
      ...scopeWhere,
    };

    const andFilters: Prisma.PersonnelWhereInput[] = [];
    if (params.q) {
      const ids = await this.idsParRechercheFloue(params.q, scopeWhere);
      andFilters.push({ id: { in: ids } });
    }
    if (params.nom) {
      andFilters.push({
        OR: [
          { nom: { contains: params.nom, mode: 'insensitive' } },
          { prenoms: { contains: params.nom, mode: 'insensitive' } },
        ],
      });
    }
    if (params.matricule) {
      andFilters.push({
        OR: [
          { matriculeRecrutement: { contains: params.matricule, mode: 'insensitive' } },
          { matriculeFinancier: { contains: params.matricule, mode: 'insensitive' } },
        ],
      });
    }
    if (params.gradeId) andFilters.push({ gradeId: params.gradeId });
    if (params.uniteId) andFilters.push({ uniteId: params.uniteId });
    if (params.baseId) andFilters.push({ unite: { baseId: params.baseId } });
    if (params.specialiteId) andFilters.push({ specialiteId: params.specialiteId });
    if (params.categorie) andFilters.push({ grade: { categorie: params.categorie as never } });
    if (params.situationMilitaire) {
      andFilters.push({ situationMilitaire: { contains: params.situationMilitaire, mode: 'insensitive' } });
    }
    if (params.corps) {
      andFilters.push({ corps: { contains: params.corps, mode: 'insensitive' } });
    }
    if (andFilters.length > 0) where.AND = andFilters;

    const triUnique = new Set([
      'gradeId', 'uniteId', 'nom', 'prenoms', 'matriculeRecrutement', 'matriculeFinancier',
      'dateNaissance', 'dateEntreeService', 'createdAt', 'numeroCIN',
    ]);
    if (params.finDeLien) {
      // Le filtre fin de lien sera appliqué en mémoire après calcul.
    }

    const orderBy: Prisma.PersonnelOrderByWithRelationInput[] = [];
    const sens = params.ordre === 'desc' ? 'desc' : 'asc';
    switch (params.tri) {
      case 'categorie':
        orderBy.push({ grade: { categorie: sens } }, { grade: { ordre: sens } });
        break;
      case 'unite':
        orderBy.push({ unite: { nom: sens } }, { nom: 'asc' });
        break;
      case 'dateNaissance':
      case 'dateEntreeService':
        orderBy.push({ [params.tri]: sens });
        break;
      case 'nom':
      case 'matriculeRecrutement':
        orderBy.push({ [params.tri]: sens });
        break;
      default:
        orderBy.push({ nom: 'asc' });
    }

    // Liste complète pour le tri/filtre sur fin de lien simple :
    // On filtre d'abord en base ; fin de lien est calculé ensuite.
    // Quand une recherche floue est active, on respecte l'ordre de pertinence
    // (les identifiants retournés par pg_trgm) plutôt que l'ordre alphabétique.
    const recherche = params.q?.trim() ?? '';
    const reordonnerFlou = recherche.length >= 3;
    let items = await this.prisma.personnel.findMany({
      where,
      include: listeInclude,
      orderBy,
      ...{
        take: reordonnerFlou ? 200 : pageSize,
        ...(reordonnerFlou ? {} : { skip: (page - 1) * pageSize }),
      },
    });

    if (reordonnerFlou) {
      const idsFlous = await this.idsParRechercheFloue(recherche, scopeWhere);
      const table = new Map(items.map((p) => [p.id, p]));
      const ordonnes: typeof items = [];
      for (const id of idsFlous) {
        const p = table.get(id);
        if (p) ordonnes.push(p);
        if (ordonnes.length >= page * pageSize) break;
      }
      items = ordonnes.slice((page - 1) * pageSize);
    }

    const enrichis = items.map((p) => {
      const fin = calculerFinDeLien(p.dateNaissance, p.grade.ageDepartRetraite);
      void triUnique;
      return {
        ...p,
        finDeLien: {
          statut: fin.statut,
          dateFinDeLien: fin.dateFinDeLien?.toISOString() ?? null,
          ageDepart: fin.ageDepart,
          enAlerte: fin.enAlerte,
        },
      };
    });

    if (params.finDeLien) {
      enrichis.sort((a, b) => {
        const ordreS = (s: string) =>
          s === 'DANS_1_AN' ? 0 : s === 'DANS_2_ANS' ? 1 : s === 'RETRAITE' ? 2 : 3;
        return ordreS(a.finDeLien.statut) - ordreS(b.finDeLien.statut);
      });
    }

    const total = await this.prisma.personnel.count({ where });

    // Filtre mémoire sur fin de lien
    let filtres = enrichis;
    if (params.finDeLien) {
      filtres = enrichis.filter((p) => p.finDeLien.statut === params.finDeLien);
    }

    // Pagination mémoire si filtre fin de lien appliqué
    if (params.finDeLien) {
      const debut = (page - 1) * pageSize;
      filtres = filtres.slice(debut, debut + pageSize);
    }

    return {
      items: filtres,
      total: params.finDeLien ? filtres.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((params.finDeLien ? filtres.length : total) / pageSize),
    };
  }

  /**
   * Recherche « floue » tolérant les fautes de frappe, via l'extension
   * PostgreSQL `pg_trgm` (similarité trigramme sur nom, prénoms, matricule).
   */
  private async idsParRechercheFloue(
    q: string,
    scopeWhere: Prisma.PersonnelWhereInput,
  ): Promise<string[]> {
    const scopeStr = scopeWhere.unite
      ? ' WHERE p."deletedAt" IS NULL AND '
      : ' WHERE p."deletedAt" IS NULL';
    const scopeClause =
      scopeWhere.unite && 'baseId' in (scopeWhere.unite as object)
        ? `EXISTS (SELECT 1 FROM "Unite" u WHERE u.id = p."uniteId" AND u."baseId" = $${1})`
        : (scopeWhere as { uniteId?: unknown })?.uniteId
          ? `p."uniteId" = $1`
          : null;

    // Construction sécurisée des paramètres.
    const clauses: string[] = [];
    const parametres: unknown[] = [];
    if (scopeClause) {
      const uniteCond = scopeWhere.unite as { baseId?: string };
      if (uniteCond.baseId) {
        clauses.push(`u."baseId" = $${parametres.length + 1}`);
        parametres.push(uniteCond.baseId);
      }
    }
    if ((scopeWhere as { uniteId?: string }).uniteId) {
      clauses.push(`p."uniteId" = $${parametres.length + 1}`);
      parametres.push((scopeWhere as { uniteId?: string }).uniteId!);
    }
    const whereSql =
      clauses.length > 0 ? ` AND ${clauses.join(' AND ')}` : '';

    if (q.trim().length < 3) {
      const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
      const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT p.id FROM "Personnel" p
         WHERE p."deletedAt" IS NULL
           AND (LOWER(p."nom") LIKE LOWER($1) OR LOWER(p."prenoms") LIKE LOWER($1)
                OR LOWER(p."matriculeRecrutement") LIKE LOWER($1)) ${whereSql}
         LIMIT 200`,
        like,
        ...parametres,
      );
      return rows.map((r) => r.id);
    }

    const rows = await this.prisma.$queryRawUnsafe<{ id: string; sim: number }[]>(
      `SELECT p.id, GREATEST(
           similarity(LOWER(p."nom"), LOWER($1)),
           similarity(LOWER(p."prenoms"), LOWER($1)),
           similarity(LOWER(p."matriculeRecrutement"), LOWER($1))
       ) AS sim
       FROM "Personnel" p ${scopeClause ? `JOIN "Unite" u ON u.id = p."uniteId"` : ''}
       WHERE p."deletedAt" IS NULL AND (
           LOWER(p."nom") % LOWER($1)
        OR LOWER(p."prenoms") % LOWER($1)
        OR LOWER(p."matriculeRecrutement") % LOWER($1)
        OR LOWER(p."nom") LIKE LOWER($1) || '%'
        OR LOWER(p."prenoms") LIKE LOWER($1) || '%'
       ) ${whereSql}
       ORDER BY sim DESC
       LIMIT 200`,
      q,
      ...parametres,
    );
    return rows.map((r) => r.id);
  }

  // -------------------------------------------------------------------------
  // Détail
  // -------------------------------------------------------------------------
  async detail(user: RequestUser, id: string): Promise<unknown> {
    const personnel = await this.prisma.personnel.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!personnel || personnel.deletedAt) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    await this.scope.verifierLecture(user, personnel);

    const fin = calculerFinDeLien(personnel.dateNaissance, personnel.grade.ageDepartRetraite);
    return {
      ...personnel,
      taille: personnel.taille ? personnel.taille.toString() : null,
      versionsActives: Object.fromEntries(
        personnel.piecesJointes.map((pj) => [pj.id, pj.versions[0] ?? null]),
      ),
      finDeLien: {
        statut: fin.statut,
        dateFinDeLien: fin.dateFinDeLien?.toISOString() ?? null,
        ageDepart: fin.ageDepart,
        enAlerte: fin.enAlerte,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Création (transactionnelle, avec création automatique du compte §2.6c)
  // -------------------------------------------------------------------------
  async creer(
    user: RequestUser,
    input: PersonnelInput,
  ): Promise<{ id: string; identifiant?: string; motDePasseProvisoire?: string }> {
    this.scope.verifierEcriture(user);
    if (input.uniteId) {
      await this.verifierUniteDansPerimetre(user, input.uniteId);
      const trouve = await this.prisma.unite.findUnique({ where: { id: input.uniteId } });
      if (!trouve) throw AppError.notFound('UNITE_NOT_FOUND', 'Unité introuvable.');
    }
    if (input.gradeId) {
      const grade = await this.prisma.grade.findUnique({ where: { id: input.gradeId } });
      if (!grade) throw AppError.notFound('GRADE_NOT_FOUND', 'Grade introuvable.');
    }

    const { enfants, historiqueGrades, cursusScolaire, stagesMilitaires, competencesLinguistiques, affectations, decorations, ...scalaires } =
      input;

    const motDePasseProvisoire = this.genererMotDePasse();
    const motDePasseHash = await hash(motDePasseProvisoire, 10);

    try {
      const resultat = await this.prisma.$transaction(async (tx) => {
        const cree = await tx.personnel.create({
          data: {
            ...(normaliserDates(
              scalaires as unknown as Record<string, unknown>,
              CHAMPS_DATE_PERSONNEL,
            ) as Prisma.PersonnelCreateInput),
            enfants: enfants?.length
              ? { create: enfants.map(({ id: _id, ...e }) => e) }
              : undefined,
            historiqueGrades: historiqueGrades?.length
              ? { create: historiqueGrades.map(({ id: _id, ...h }) => h) }
              : undefined,
            cursusScolaire: cursusScolaire?.length
              ? { create: cursusScolaire.map(({ id: _id, ...c }) => c) }
              : undefined,
            stagesMilitaires: stagesMilitaires?.length
              ? { create: stagesMilitaires.map(({ id: _id, ...s }) => s) }
              : undefined,
            competencesLinguistiques: competencesLinguistiques?.length
              ? { createMany: { data: competencesLinguistiques.map(({ id: _id, ...l }) => l) } }
              : undefined,
            affectations: affectations?.length
              ? { create: affectations.map(({ id: _id, ...a }) => a) }
              : undefined,
            decorations: decorations?.length
              ? { create: decorations.map(({ id: _id, ...d }) => d) }
              : undefined,
          },
        });

        // §2.6c : compte créé automatiquement avec la fiche.
        const identifiant = input.matriculeFinancier || input.matriculeRecrutement;
        await tx.compteUtilisateur.create({
          data: {
            personnelId: cree.id,
            identifiant,
            motDePasseHash,
            typeCompte: 'PERSONNEL',
            doitChangerMotDePasse: true,
            dateCreation: new Date(),
          },
        });
        return { id: cree.id, identifiant };
      });
      await this.audit.log({
        compteId: user.compteId,
        action: 'CREATION',
        entite: 'Personnel',
        entiteId: resultat.id,
        personnelId: resultat.id,
        nouvelleValeur: `${scalaires.nom} ${scalaires.prenoms}`,
        ip: null,
      });
      return { id: resultat.id, identifiant: resultat.identifiant, motDePasseProvisoire };
    } catch (error) {
      this.rejeterErreurUnique(error);
    }
  }

  // -------------------------------------------------------------------------
  // Modification (champs scalaires uniquement — historiques gérés à part)
  // -------------------------------------------------------------------------
  async modifier(user: RequestUser, id: string, data: Partial<PersonnelInput>): Promise<void> {
    this.scope.verifierEcriture(user);
    const actuel = await this.prisma.personnel.findUnique({ where: { id } });
    if (!actuel || actuel.deletedAt) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    await this.scope.verifierLecture(user, actuel);

    // On n'accepte que les champs scalaires (les historiques passent par leurs
    // propres endpoints pour ne jamais écraser l'historique).
    const allowed = [
      'matriculeRecrutement','matriculeFinancier','nom','prenoms','email','telephoneMobile',
      'dateNaissance','lieuNaissance','prefecture','sousPrefecture','province',
      'numeroCIN','dateDelivranceCIN','lieuDelivranceCIN','dateDuplicataCIN',
      'numeroPasseport','dateDelivrancePasseport','religion','groupeSanguin','taille',
      'adresseActuelle','adresseRepli','contactUrgence','statutFamilial',
      'numeroAutorisationMariage','dateAutorisationMariage','nomConjoint',
      'dateNaissanceConjoint','lieuNaissanceConjoint','fonctionConjoint',
      'sportsPratiques','nomPere','nomMere','corps','lieuEmploi','fonctionActuelle',
      'numeroCIM','dateDelivranceCIM','dateEffetSOC_HDRC','referenceSOC_HDRC',
      'dateEffetPrimeTechnicite','referencePrimeTechnicite','numeroPermisCivil','datePermisCivil',
      'numeroPermisMilitaire','datePermisMilitaire','situationMilitaire','origineRecrutement',
      'dateEntreeService','interruptionsService','dateLiberationServiceNational',
      'datePremierRengagement','niveauInstruction','connaissancesInformatiques',
      'gradeId','uniteId','specialiteId',
    ] as const;

    const final: Record<string, unknown> = {};
    for (const champ of allowed) {
      if (champ in data) {
        const valeur = (data as Record<string, unknown>)[champ];
        final[champ] = valeur ?? null;
      }
    }

    if (final.uniteId) {
      await this.verifierUniteDansPerimetre(user, final.uniteId as string);
    }

    const maj = await this.prisma.personnel.update({
      where: { id },
      data: normaliserDates(final, CHAMPS_DATE_PERSONNEL) as Prisma.PersonnelUpdateInput,
    }).catch((e) => {
      this.rejeterErreurUnique(e);
    });

    // Audit des champs modifiés
    for (const [champ, nouvelle] of Object.entries(final)) {
      const ancienne = (actuel as unknown as Record<string, unknown>)[champ];
      if (ancienne !== nouvelle) {
        await this.audit.log({
          compteId: user.compteId,
          action: 'MODIFICATION',
          entite: 'Personnel',
          entiteId: id,
          personnelId: id,
          champModifie: champ,
          ancienneValeur: ancienne === null ? null : String(ancienne),
          nouvelleValeur: nouvelle === null ? null : String(nouvelle),
          ip: null,
        });
      }
    }
    void maj;
  }

  // -------------------------------------------------------------------------
  // Suppression (soft delete : données sensibles jamais physiquement effacées)
  // -------------------------------------------------------------------------
  async supprimer(user: RequestUser, id: string): Promise<void> {
    this.scope.verifierEcriture(user);
    const actuel = await this.prisma.personnel.findUnique({ where: { id } });
    if (!actuel || actuel.deletedAt) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    await this.scope.verifierLecture(user, actuel);
    if (user.perimetre.type !== 'GLOBAL') {
      throw AppError.forbidden(
        'PERMISSION_DENIED',
        'Seul un administrateur ou le RH État-Major peut supprimer une fiche.',
      );
    }
    await this.prisma.personnel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.log({
      compteId: user.compteId,
      action: 'SUPPRESSION',
      entite: 'Personnel',
      entiteId: id,
      personnelId: id,
      ip: null,
    });
  }

  // -------------------------------------------------------------------------
  // Doublons (CIN / matricule) — CDC §2.4, §2.5.5
  // -------------------------------------------------------------------------
  async doublons(): Promise<unknown[]> {
    const raw = await this.prisma.$queryRaw<{
      cle: string;
      type: string;
      ids: string[];
      nb: number;
    }[]>`
      SELECT
        CLE, TYPE, ids, nb FROM (
        SELECT "numeroCIN" AS cle, 'CIN' AS type, ARRAY_AGG(id::text) AS ids, COUNT(*) AS nb
        FROM "Personnel" WHERE "numeroCIN" IS NOT NULL AND "deletedAt" IS NULL
        GROUP BY "numeroCIN" HAVING COUNT(*) > 1
        UNION ALL
        SELECT "matriculeRecrutement" AS cle, 'MATRICULE' AS type, ARRAY_AGG(id::text) AS ids, COUNT(*) AS nb
        FROM "Personnel" WHERE "deletedAt" IS NULL
        GROUP BY "matriculeRecrutement" HAVING COUNT(*) > 1
      ) t ORDER BY nb DESC`;
    return raw;
  }

  // -------------------------------------------------------------------------
  // Fin de lien / retraite (alertes colorées du CDC §2.3)
  // -------------------------------------------------------------------------
  async finDeLien(user: RequestUser): Promise<unknown[]> {
    const personnels = await this.prisma.personnel.findMany({
      where: { deletedAt: null, ...this.scope.filtrePersonnel(user) },
      include: { grade: true, unite: { include: { base: true } } },
      orderBy: { dateNaissance: 'asc' },
    });
    return personnels
      .map((p) => {
        const fin = calculerFinDeLien(p.dateNaissance, p.grade.ageDepartRetraite);
        return { ...p, finDeLien: fin };
      })
      .filter((p) => p.finDeLien.enAlerte)
      .sort((a, b) => {
        const ordre = { DANS_1_AN: 0, DANS_2_ANS: 1, RETRAITE: 2 } as const;
        return (ordre[a.finDeLien.statut as keyof typeof ordre] ?? 3) -
               (ordre[b.finDeLien.statut as keyof typeof ordre] ?? 3);
      });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private async verifierUniteDansPerimetre(user: RequestUser, uniteId: string): Promise<void> {
    const unite = await this.prisma.unite.findUnique({ where: { id: uniteId } });
    if (!unite) throw AppError.notFound('UNITE_NOT_FOUND', 'Unité introuvable.');
    if (user.perimetre.type === 'BASE' && unite.baseId !== user.perimetre.baseId) {
      throw AppError.forbidden('PERIMETRE_RESTREINT', "Cette unité est hors de votre périmètre.");
    }
    if (user.perimetre.type === 'UNITE' && unite.id !== user.perimetre.uniteId) {
      throw AppError.forbidden('PERIMETRE_RESTREINT', "Cette unité est hors de votre périmètre.");
    }
  }

  private genererMotDePasse(): string {
    const maj = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const min = 'abcdefghijkmnpqrstuvwxyz';
    const chiffres = '23456789';
    const pick = (s: string, n: number) =>
      Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
    return `${pick(maj, 4)}${pick(chiffres, 4)}${pick(min, 4)}`;
  }

  private rejeterErreurUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const cible = (error.meta?.target as string[]) ?? [];
      if (cible.includes('numeroCIN')) {
        throw AppError.conflict('PERSONNEL_DUPLICATE_CIN', 'Une personne possède déjà cette CIN.');
      }
      if (cible.includes('matriculeRecrutement')) {
        throw AppError.conflict(
          'PERSONNEL_DUPLICATE_MATRICULE_RECRUTEMENT',
          'Un dossier possède déjà ce matricule de recrutement.',
        );
      }
      if (cible.includes('matriculeFinancier')) {
        throw AppError.conflict(
          'PERSONNEL_DUPLICATE_MATRICULE_FINANCIER',
          'Un dossier possède déjà ce matricule financier.',
        );
      }
      if (cible.includes('email')) {
        throw AppError.conflict('PERSONNEL_DUPLICATE_EMAIL', 'Une personne possède déjà cet e-mail.');
      }
      throw AppError.conflict('DUPLICATE_VALUE', 'Un doublon est détecté sur une valeur unique.');
    }
    throw error;
  }
}