import { SetMetadata } from '@nestjs/common';
import type { RequestUser } from './jwt-auth.guard';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RequestUser['typeCompte'][]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(PUBLIC_KEY, true);