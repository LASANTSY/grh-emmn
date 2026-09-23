import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PUBLIC_KEY } from './roles.decorator';

export type PerimetreType = 'GLOBAL' | 'BASE' | 'UNITE' | 'SOI';

export interface RequestUser {
  compteId: string;
  personnelId: string;
  identifiant: string;
  typeCompte: 'ADMIN_SYSTEME' | 'RH_ETAT_MAJOR' | 'RH_BASE' | 'CHEF_COMMANDEMENT' | 'PERSONNEL';
  perimetre: {
    type: PerimetreType;
    baseId?: string | null;
    uniteId?: string | null;
  };
}

export interface AuthRequest extends Request {
  user?: RequestUser;
}

/**
 * Guard global d'authentification (JWT via cookie/bearer). Les routes
 * marquées @Public() ne nécessitent pas de session.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}