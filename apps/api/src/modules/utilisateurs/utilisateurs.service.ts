import { Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Prisma, TypeCompte } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

@Injectable()
export class UtilisateursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(): Promise<unknown[]> {
    return this.prisma.compteUtilisateur.findMany({
      orderBy: { dateCreation: 'desc' },
      include: {
        personnel: { select: { id: true, nom: true, prenoms: true, matriculeRecrutement: true } },
        unite: { select: { id: true, nom: true, baseId: true } },
      },
    });
  }

  async creer(
    input: {
      personnelId: string;
      identifiant: string;
      typeCompte: TypeCompte;
      uniteId?: string | null;
      motDePasseProvisoire: string;
      actif?: boolean;
    },
    user: RequestUser,
  ): Promise<unknown> {
    const personnel = await this.prisma.personnel.findUnique({
      where: { id: input.personnelId },
      select: { id: true, uniteId: true },
    });
    if (!personnel) {
      throw AppError.notFound('PERSONNEL_NOT_FOUND', 'Fiche personnel introuvable.');
    }
    const existe = await this.prisma.compteUtilisateur.findUnique({
      where: { identifiant: input.identifiant },
    });
    if (existe) throw AppError.conflict('COMPTE_DUPLICATE', 'Cet identifiant est déjà utilisé.');

    if (input.typeCompte === 'RH_BASE' || input.typeCompte === 'CHEF_COMMANDEMENT') {
      const unitePerimetre = input.uniteId ?? personnel.uniteId;
      if (!unitePerimetre) {
        throw AppError.conflict(
          'PERIMETRE_REQUIS',
          'Un périmètre (unité/base) est requis pour ce type de compte.',
        );
      }
      input.uniteId = unitePerimetre;
    }

    const motDePasseHash = await hash(input.motDePasseProvisoire, 10);
    try {
      const compte = await this.prisma.compteUtilisateur.create({
        data: {
          personnelId: input.personnelId,
          identifiant: input.identifiant,
          motDePasseHash,
          typeCompte: input.typeCompte,
          uniteId: input.uniteId ?? null,
          actif: input.actif ?? true,
          doitChangerMotDePasse: true,
          dateCreation: new Date(),
        },
        include: { personnel: true, unite: true },
      });
      await this.audit.log({
        compteId: user.compteId, action: 'CREATION', entite: 'CompteUtilisateur',
        entiteId: compte.id, nouvelleValeur: compte.identifiant,
      });
      return compte;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw AppError.conflict('COMPTE_DUPLICATE', 'Cet identifiant est déjà utilisé.');
      }
      throw e;
    }
  }

  async modifier(
    id: string,
    data: { typeCompte?: TypeCompte; uniteId?: string | null; actif?: boolean; identifiant?: string },
    user: RequestUser,
  ): Promise<unknown> {
    const compte = await this.prisma.compteUtilisateur.findUnique({ where: { id } });
    if (!compte) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    const maj = await this.prisma.compteUtilisateur.update({
      where: { id },
      data: {
        ...(data.typeCompte ? { typeCompte: data.typeCompte } : {}),
        ...(data.uniteId !== undefined ? { uniteId: data.uniteId ?? null } : {}),
        ...(data.actif !== undefined ? { actif: data.actif } : {}),
        ...(data.identifiant ? { identifiant: data.identifiant } : {}),
      },
      include: { personnel: true, unite: true },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'CHANGEMENT_PERMISSION', entite: 'CompteUtilisateur',
      entiteId: id, nouvelleValeur: maj.typeCompte,
    });
    return maj;
  }

  async desactiver(id: string, user: RequestUser): Promise<void> {
    const compte = await this.prisma.compteUtilisateur.findUnique({ where: { id } });
    if (!compte) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    await this.prisma.compteUtilisateur.update({
      where: { id },
      data: { actif: false, compteVerrouille: false, tentativesEchec: 0 },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'CHANGEMENT_COMPTE', entite: 'CompteUtilisateur',
      entiteId: id, nouvelleValeur: 'désactivé',
    });
  }

  async reinitialiser(
    id: string,
    nouveauMotDePasse: string,
    user: RequestUser,
  ): Promise<{ motDePasseProvisoire: string }> {
    const compte = await this.prisma.compteUtilisateur.findUnique({ where: { id } });
    if (!compte) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    const motDePasseHash = await hash(nouveauMotDePasse, 10);
    await this.prisma.compteUtilisateur.update({
      where: { id },
      data: {
        motDePasseHash,
        doitChangerMotDePasse: true,
        compteVerrouille: false,
        tentativesEchec: 0,
        dateVerrouillage: null,
        actif: true,
      },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'CHANGEMENT_COMPTE', entite: 'CompteUtilisateur',
      entiteId: id, champModifie: 'motDePasse(reset)',
    });
    return { motDePasseProvisoire: nouveauMotDePasse };
  }
}