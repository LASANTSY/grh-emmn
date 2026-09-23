import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

const CHAMPS_APPLICABLES: Record<string, 'string' | 'date' | 'number' | 'boolean'> = {
  nom: 'string',
  prenoms: 'string',
  dateNaissance: 'date',
  lieuNaissance: 'string',
  numeroCIN: 'string',
  email: 'string',
  telephoneMobile: 'string',
  adresseActuelle: 'string',
  statutFamilial: 'string',
  religion: 'string',
};

@Injectable()
export class DemandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  async lister(user: RequestUser): Promise<unknown[]> {
    const consultation = {
      orderBy: { dateDemande: 'desc' as const },
      include: {
        personnel: { select: { id: true, nom: true, prenoms: true, matriculeRecrutement: true } },
        validePar: { select: { identifiant: true } },
      },
    };
    if (user.typeCompte === 'PERSONNEL') {
      return this.prisma.demandeModification.findMany({
        where: { compteId: user.compteId },
        ...consultation,
      });
    }
    const { baseIds } = await this.scope.perimetre(user);
    if (baseIds === 'TOUTES') {
      return this.prisma.demandeModification.findMany(consultation);
    }
    return this.prisma.demandeModification.findMany({
      ...consultation,
      where: { personnel: { unite: { baseId: { in: baseIds } } } },
    });
  }

  async creer(
    user: RequestUser,
    input: {
      personnelId: string;
      champModifie: string;
      ancienneValeur?: string;
      nouvelleValeur?: string;
      commentaire?: string;
    },
  ): Promise<unknown> {
    const personnel = await this.prisma.personnel.findUnique({
      where: { id: input.personnelId },
      select: { id: true, uniteId: true, deletedAt: true },
    });
    if (!personnel || personnel.deletedAt) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    if (user.typeCompte === 'PERSONNEL' && personnel.id !== user.personnelId) {
      throw AppError.forbidden('ACCES_REFUSE', 'Vous ne pouvez demander une modification que sur votre propre fiche.');
    }
    if (!(input.champModifie in CHAMPS_APPLICABLES)) {
      throw AppError.conflict('CHAMP_NON_MODIFIABLE', 'Ce champ ne peut pas être modifié via une demande.');
    }
    const demande = await this.prisma.demandeModification.create({
      data: {
        personnelId: input.personnelId,
        compteId: user.compteId,
        champModifie: input.champModifie,
        ancienneValeur: input.ancienneValeur ?? null,
        nouvelleValeur: input.nouvelleValeur ?? null,
        commentaire: input.commentaire ?? null,
        statut: 'EN_ATTENTE',
        dateDemande: new Date(),
      },
      include: { personnel: true },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'MODIFICATION', entite: 'DemandeModification',
      entiteId: demande.id, personnelId: demande.personnelId, champModifie: demande.champModifie,
    });
    return demande;
  }

  private async trouverValidable(id: string, user: RequestUser) {
    const d = await this.prisma.demandeModification.findUnique({
      where: { id },
      include: { personnel: { select: { id: true, uniteId: true, deletedAt: true } } },
    });
    if (!d) throw AppError.notFound('DEMANDE_NOT_FOUND', 'Demande introuvable.');
    if (d.statut !== 'EN_ATTENTE') {
      throw AppError.conflict('DEMANDE_DEJA_TRAITEE', 'Cette demande a déjà été traitée.');
    }
    await this.scope.verifierLecture(user, d.personnel);
    return d;
  }

  async valider(id: string, user: RequestUser, commentaire?: string): Promise<void> {
    const d = await this.trouverValidable(id, user);
    try {
      await this.prisma.$transaction(async (tx) => {
        const typeChamp = CHAMPS_APPLICABLES[d.champModifie];
        const valeur: unknown = typeChamp === 'date'
          ? new Date(d.nouvelleValeur ?? '')
          : typeChamp === 'number'
            ? Number(d.nouvelleValeur)
            : typeChamp === 'boolean'
              ? d.nouvelleValeur === 'true' || d.nouvelleValeur === '1'
              : d.nouvelleValeur ?? '';
        await tx.personnel.update({
          where: { id: d.personnelId },
          data: { [d.champModifie]: valeur },
        });
        await tx.demandeModification.update({
          where: { id },
          data: {
            statut: 'VALIDEE',
            valideParId: user.compteId,
            dateTraitement: new Date(),
            commentaire: commentaire ?? null,
          },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
      }
      throw AppError.conflict('VALEUR_INVALIDE', 'La nouvelle valeur ne correspond pas au type du champ.');
    }
    await this.audit.log({
      compteId: user.compteId, action: 'VALIDATION', entite: 'DemandeModification',
      entiteId: id, personnelId: d.personnelId, champModifie: d.champModifie,
    });
  }

  async rejeter(id: string, motif: string, user: RequestUser): Promise<void> {
    const d = await this.trouverValidable(id, user);
    await this.prisma.demandeModification.update({
      where: { id },
      data: {
        statut: 'REJETEE',
        valideParId: user.compteId,
        dateTraitement: new Date(),
        commentaire: motif || null,
      },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'REJET', entite: 'DemandeModification',
      entiteId: id, personnelId: d.personnelId,
    });
  }
}