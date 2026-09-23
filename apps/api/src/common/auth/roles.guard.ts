import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../errors/app-error';
import { ROLES_KEY, PUBLIC_KEY } from './roles.decorator';
import { AuthRequest } from './jwt-auth.guard';

/**
 * Vérifie le RBAC sur les routes marquées @Roles(...). Les routes @Public()
 * (ou sans annotation) restent autorisées si l'utilisateur est authentifié.
 * NB : JwtAuthGuard est global ; @Public() désactive l'exigence d'auth.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Array<string>>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    if (!user) {
      throw AppError.unauthorized('AUTH_REQUIRED', 'Authentification requise.');
    }
    if (!requiredRoles.includes(user.typeCompte)) {
      throw AppError.forbidden(
        'PERMISSION_DENIED',
        "Vous n'avez pas les droits nécessaires pour cette action.",
      );
    }
    return true;
  }
}