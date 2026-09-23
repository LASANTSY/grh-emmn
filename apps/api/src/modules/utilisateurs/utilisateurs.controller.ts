import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TypeCompte } from '@prisma/client';
import { UtilisateursService } from './utilisateurs.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';
import { AuthService } from '../auth/auth.service';

@ApiTags('utilisateurs')
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(
    private readonly utilisateurs: UtilisateursService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @Roles('ADMIN_SYSTEME')
  lister() {
    return this.utilisateurs.lister();
  }

  @Post()
  @Roles('ADMIN_SYSTEME')
  async creer(@Body() body: {
    personnelId: string;
    identifiant: string;
    typeCompte: TypeCompte;
    uniteId?: string | null;
  }, @CurrentUser() user: RequestUser) {
    if (!body.personnelId || !body.identifiant || !body.typeCompte) {
      throw AppError.conflict('VALIDATION_ERROR', 'personnelId, identifiant et typeCompte sont requis.');
    }
    const motDePasseProvisoire = await this.auth.genererMotDePasseProvisoire();
    return this.utilisateurs.creer({ ...body, motDePasseProvisoire }, user).then((compte) => ({
      compte,
      motDePasseProvisoire,
      message: 'Identifiant et mot de passe provisoire à communiquer à l’utilisateur.',
    }));
  }

  @Patch(':id')
  @Roles('ADMIN_SYSTEME')
  modifier(@Param('id') id: string, @Body() body: {
    typeCompte?: TypeCompte;
    uniteId?: string | null;
    actif?: boolean;
    identifiant?: string;
  }, @CurrentUser() user: RequestUser) {
    return this.utilisateurs.modifier(id, body, user);
  }

  @Delete(':id')
  @Roles('ADMIN_SYSTEME')
  async desactiver(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.utilisateurs.desactiver(id, user);
    return { ok: true };
  }

  @Post(':id/reinitialiser')
  @Roles('ADMIN_SYSTEME')
  async reinitialiser(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{
    ok: true;
    motDePasseProvisoire: string;
  }> {
    const motDePasseProvisoire = await this.auth.genererMotDePasseProvisoire();
    await this.utilisateurs.reinitialiser(id, motDePasseProvisoire, user);
    return { ok: true, motDePasseProvisoire };
  }
}
