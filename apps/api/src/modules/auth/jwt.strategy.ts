import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';

interface JwtPayload {
  sub: string; // compteId
  identifiant: string;
  iat?: number;
  exp?: number;
}

/**
 * Stratégie JWT : à chaque requête, recharge le compte depuis la base pour
 * disposer d'un état de fraîcheur (verrouillage/désactivation) et calcule le
 * périmètre organisationnel (base/unité/soi/global).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req.cookies && req.cookies['grh_token']) return req.cookies['grh_token'];
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const compte = await this.prisma.compteUtilisateur.findUnique({
      where: { id: payload.sub },
      include: { unite: { include: { base: true } } },
    });

    if (!compte) throw AppError.unauthorized('AUTH_REQUIRED', 'Compte introuvable.');
    if (!compte.actif) throw AppError.forbidden('ACCOUNT_DESACTIVE', 'Compte désactivé.');
    if (compte.compteVerrouille) {
      throw AppError.forbidden('ACCOUNT_LOCKED', 'Compte verrouillé pour raisons de sécurité.');
    }

    const unite = compte.unite;
    let perimetre: RequestUser['perimetre'];

    switch (compte.typeCompte) {
      case 'ADMIN_SYSTEME':
      case 'RH_ETAT_MAJOR':
        perimetre = { type: 'GLOBAL' };
        break;
      case 'RH_BASE':
      case 'CHEF_COMMANDEMENT':
        if (unite) {
          perimetre = { type: 'BASE', baseId: unite.baseId, uniteId: unite.id };
        } else {
          perimetre = { type: 'GLOBAL' };
        }
        break;
      case 'PERSONNEL':
        perimetre = { type: 'SOI', uniteId: undefined };
        break;
      default:
        perimetre = { type: 'GLOBAL' };
    }

    return {
      compteId: compte.id,
      personnelId: compte.personnelId,
      identifiant: compte.identifiant,
      typeCompte: compte.typeCompte,
      perimetre,
    };
  }
}