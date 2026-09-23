import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { changePasswordSchema } from '@grh/validation';

export function permissionsFor(type: RequestUser['typeCompte']): string[] {
  switch (type) {
    case 'ADMIN_SYSTEME':
      return ['*'];
    case 'RH_ETAT_MAJOR':
      return [
        'personnel:read', 'personnel:write', 'personnel:delete', 'personnel:export',
        'referentiel:read', 'referentiel:write', 'import:run', 'utilisateurs:read',
        'demandes:valider', 'audit:read', 'rapports:read', 'stats:read',
        'documents:read', 'documents:write', 'utilisateurs:reinitialiser',
      ];
    case 'RH_BASE':
      return [
        'personnel:read', 'personnel:write', 'personnel:export',
        'referentiel:read', 'import:run', 'demandes:valider',
        'rapports:read', 'stats:read', 'documents:read', 'documents:write',
      ];
    case 'CHEF_COMMANDEMENT':
      return [
        'personnel:read', 'referentiel:read', 'rapports:read', 'stats:read',
        'documents:read', 'demandes:valider',
      ];
    case 'PERSONNEL':
      return ['fiche:lire-soi', 'fiche:demander-modification', 'documents:gerer-soi'];
    default:
      return [];
  }
}

interface RateLimitEntry {
  tentatives: number[];
}

@Injectable()
export class AuthService {
  // Limitation simple des tentatives en mémoire (documenté : à remplacer par
  // un cache distribué en multi-instance).
  private readonly rate = new Map<string, RateLimitEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private rateCheck(cle: string): void {
    const now = Date.now();
    const fenetre = 10 * 60_000; // 10 minutes
    const entree = this.rate.get(cle) ?? { tentatives: [] };
    entree.tentatives = entree.tentatives.filter((t) => now - t < fenetre);
    if (entree.tentatives.length >= 10) {
      throw AppError.tooManyRequests(
        'TROP_MANY_ATTEMPTS',
        'Trop de tentatives. Réessayez dans quelques minutes.',
      );
    }
    entree.tentatives.push(now);
    this.rate.set(cle, entree);
  }

  private cleRate(cntx: { ip: string; identifiant: string }): string {
    return `${cntx.ip}|${cntx.identifiant.toLowerCase()}`;
  }

  async connexion(
    identifiant: string,
    motDePasse: string,
    context: { ip?: string },
  ): Promise<{ token: string; compte: unknown; doitChangerMotDePasse: boolean }> {
    this.rateCheck(this.cleRate({ ip: context.ip ?? 'inconnu', identifiant }));
    const ip = context.ip ?? null;

    const compte = await this.prisma.compteUtilisateur.findUnique({
      where: { identifiant },
      include: { unite: { include: { base: true } } },
    });
    if (!compte) {
      await this.audit.log({
        compteId: null, action: 'ECHEC_CONNEXION', entite: 'CompteUtilisateur',
        details: { identifiant }, ip,
      });
      throw AppError.unauthorized('AUTH_INVALID', 'Identifiant ou mot de passe incorrect.');
    }

    // Verrouillage permanent ? (ou temporaire encore actif)
    if (compte.compteVerrouille) {
      const verrou = compte.dateVerrouillage;
      const duree = this.config.get<number>('LOGIN_LOCK_MINUTES') ?? 15;
      if (verrou && Date.now() - verrou.getTime() < duree * 60_000) {
        throw AppError.forbidden(
          'ACCOUNT_LOCKED',
          `Compte verrouillé suite à des tentatives échouées. Réessayez après ${duree} minutes.`,
        );
      }
      // délai expiré : on déverrouille automatiquement
      await this.prisma.compteUtilisateur.update({
        where: { id: compte.id },
        data: { compteVerrouille: false, tentativesEchec: 0 },
      });
    }

    if (!compte.actif) {
      await this.audit.log({
        compteId: compte.id, action: 'ECHEC_CONNEXION', entite: 'CompteUtilisateur',
        entiteId: compte.id, details: { raison: 'inactif' }, ip,
      });
      throw AppError.forbidden('ACCOUNT_DESACTIVE', 'Ce compte est désactivé.');
    }

    const ok = await compare(motDePasse, compte.motDePasseHash);
    if (!ok) {
      const max = this.config.get<number>('LOGIN_MAX_ATTEMPTS') ?? 5;
      const tentatives = compte.tentativesEchec + 1;
      const verrouille = tentatives >= max;
      await this.prisma.compteUtilisateur.update({
        where: { id: compte.id },
        data: {
          tentativesEchec: tentatives,
          ...(verrouille ? { compteVerrouille: true, dateVerrouillage: new Date() } : {}),
        },
      });
      await this.audit.log({
        compteId: compte.id, action: 'ECHEC_CONNEXION', entite: 'CompteUtilisateur',
        entiteId: compte.id, details: { tentatives }, ip,
      });
      if (verrouille) {
        throw AppError.forbidden('ACCOUNT_LOCKED', 'Compte verrouillé pour raisons de sécurité.');
      }
      throw AppError.unauthorized('AUTH_INVALID', 'Identifiant ou mot de passe incorrect.');
    }

    await this.prisma.compteUtilisateur.update({
      where: { id: compte.id },
      data: { tentativesEchec: 0, compteVerrouille: false, dateVerrouillage: null, dateDernierAcces: new Date() },
    });
    await this.audit.log({
      compteId: compte.id, action: 'CONNEXION', entite: 'CompteUtilisateur', entiteId: compte.id, ip,
    });

    const token = await this.jwt.signAsync({
      sub: compte.id,
      identifiant: compte.identifiant,
    });

    return {
      token,
      compte: {
        id: compte.id,
        identifiant: compte.identifiant,
        typeCompte: compte.typeCompte,
        personnelId: compte.personnelId,
        perimetre: {
          baseId: compte.unite?.baseId ?? null,
          uniteId: compte.uniteId ?? null,
        },
      },
      doitChangerMotDePasse: compte.doitChangerMotDePasse,
    };
  }

  async me(user: RequestUser): Promise<{ compte: unknown; permissions: string[]; perimetre: unknown }> {
    const compte = await this.prisma.compteUtilisateur.findUnique({
      where: { id: user.compteId },
      include: {
        personnel: { select: { id: true, nom: true, prenoms: true, matriculeRecrutement: true } },
        unite: { include: { base: true } },
      },
    });
    if (!compte) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    return {
      compte: {
        id: compte.id,
        identifiant: compte.identifiant,
        typeCompte: compte.typeCompte,
        personnelId: compte.personnelId,
        uniteId: compte.uniteId,
        actif: compte.actif,
        compteVerrouille: compte.compteVerrouille,
        dateCreation: compte.dateCreation,
        dateDernierAcces: compte.dateDernierAcces,
        doitChangerMotDePasse: compte.doitChangerMotDePasse,
        unite: compte.unite ? { id: compte.unite.id, nom: compte.unite.nom, baseId: compte.unite.baseId } : null,
        personnel: compte.personnel,
      },
      permissions: permissionsFor(compte.typeCompte),
      perimetre: user.perimetre,
    };
  }

  async changerMotDePasse(
    user: RequestUser,
    ancienMotDePasse: string,
    nouveauMotDePasse: string,
  ): Promise<void> {
    const parsed = changePasswordSchema.safeParse({
      ancienMotDePasse,
      nouveauMotDePasse,
    });
    if (!parsed.success) {
      const p = parsed.error.issues[0];
      throw AppError.conflict(
        p.message ?? 'PASSWORD_POLICY',
        'Le mot de passe ne respecte pas la politique de sécurité.',
      );
    }
    const compte = await this.prisma.compteUtilisateur.findUnique({
      where: { id: user.compteId },
    });
    if (!compte) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    const ok = await compare(ancienMotDePasse, compte.motDePasseHash);
    if (!ok) throw AppError.unauthorized('PASSWORD_INCORRECT', 'Ancien mot de passe incorrect.');

    const nouveauHash = await hash(nouveauMotDePasse, 10);
    await this.prisma.compteUtilisateur.update({
      where: { id: compte.id },
      data: { motDePasseHash: nouveauHash, doitChangerMotDePasse: false },
    });
    await this.audit.log({
      compteId: compte.id, action: 'CHANGEMENT_COMPTE', entite: 'CompteUtilisateur',
      entiteId: compte.id, champModifie: 'motDePasse', ip: null,
    });
  }

  async reinitialiserMotDePasse(
    compteCibleId: string,
    user: RequestUser,
    nouveauMotDePasse: string,
  ): Promise<void> {
    const cible = await this.prisma.compteUtilisateur.findUnique({ where: { id: compteCibleId } });
    if (!cible) throw AppError.notFound('COMPTE_NOT_FOUND', 'Compte introuvable.');
    const hashMotDePasse = await hash(nouveauMotDePasse, 10);
    await this.prisma.compteUtilisateur.update({
      where: { id: cible.id },
      data: {
        motDePasseHash: hashMotDePasse,
        doitChangerMotDePasse: true,
        compteVerrouille: false,
        tentativesEchec: 0,
        dateVerrouillage: null,
      },
    });
    await this.audit.log({
      compteId: user.compteId, action: 'CHANGEMENT_COMPTE', entite: 'CompteUtilisateur',
      entiteId: cible.id, champModifie: 'motDePasse(reset)', ip: null,
    });
  }

  async genererMotDePasseProvisoire(): Promise<string> {
    // Mot de passe temporaire robuste (jamais stocké en clair par la suite).
    const charsetMaj = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsetMin = 'abcdefghijkmnpqrstuvwxyz';
    const chiffres = '23456789';
    const pick = (s: string, n: number) =>
      Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
    return `${pick(charsetMaj, 4)}${pick(chiffres, 4)}${pick(charsetMin, 4)}`;
  }
}