import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('synthese')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  synthese(@CurrentUser() user: RequestUser) {
    return this.dashboard.synthèse(user);
  }

  @Get('repartition')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  repartition(@CurrentUser() user: RequestUser) {
    return this.dashboard.repartition(user);
  }

  @Get('par-base')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  parBase(@CurrentUser() user: RequestUser) {
    return this.dashboard.parBase(user);
  }

  @Get('par-base-hierarchique')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  parBaseHierarchique(@CurrentUser() user: RequestUser) {
    return this.dashboard.parBaseHierarchique(user);
  }

  @Get('categories')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  categories(@CurrentUser() user: RequestUser) {
    return this.dashboard.repartitionCategories(user);
  }

  @Get('genres')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  genres(@CurrentUser() user: RequestUser) {
    return this.dashboard.genres(user);
  }

  @Get('retraites-par-annee')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  retraitesParAnnee(@CurrentUser() user: RequestUser) {
    return this.dashboard.retraitesParAnnee(user);
  }

  @Get('comparaison')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  comparaison(
    @CurrentUser() user: RequestUser,
    @Query('uniteId') uniteId?: string,
    @Query('baseId') baseId?: string,
  ) {
    if (!uniteId && !baseId) {
      throw AppError.conflict('VALIDATION_ERROR', 'Paramètre uniteId ou baseId requis.');
    }
    return this.dashboard.comparaison(user, uniteId, baseId);
  }

  @Get('pyramide')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  pyramide(@CurrentUser() user: RequestUser) {
    return this.dashboard.pyramideAges(user);
  }

  @Get('evolution')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  evolution(@CurrentUser() user: RequestUser) {
    return this.dashboard.evolutionRecrutements(user);
  }
}
