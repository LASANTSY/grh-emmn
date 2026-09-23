import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PersonnelService, RechercheParams } from './personnel.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { personnelInputSchema } from '@grh/validation';
import { AppError } from '../../common/errors/app-error';

@ApiTags('personnel')
@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnel: PersonnelService) {}

  @Get()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  lister(@Query() params: RechercheParams, @CurrentUser() user: RequestUser) {
    return this.personnel.rechercher(user, params);
  }

  @Get('rechercher')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  rechercher(@Query() params: RechercheParams, @CurrentUser() user: RequestUser) {
    return this.personnel.rechercher(user, params);
  }

  @Get('doublons')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  doublons() {
    return this.personnel.doublons();
  }

  @Get('annuaire')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  annuaire(@Query() params: RechercheParams, @CurrentUser() user: RequestUser) {
    return this.personnel.annuaire(user, params);
  }

  @Get('fin-de-lien')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  finDeLien(@CurrentUser() user: RequestUser) {
    return this.personnel.finDeLien(user);
  }

  @Get(':id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  detail(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.personnel.detail(user, id);
  }

  @Post()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creer(@Body() body: unknown, @CurrentUser() user: RequestUser) {
    const parsed = personnelInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.conflict(
        issue.code === 'invalid_type' ? 'VALIDATION_ERROR' : `VALIDATION_${issue.path.join('.')}`,
        issue.message,
      );
    }
    return this.personnel.creer(user, parsed.data);
  }

  @Patch(':id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifier(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
    const parsed = personnelInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw AppError.conflict('VALIDATION_ERROR', issue.message);
    }
    return this.personnel.modifier(user, id, parsed.data);
  }

  @Delete(':id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR')
  async supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.personnel.supprimer(user, id);
    return { ok: true };
  }
}