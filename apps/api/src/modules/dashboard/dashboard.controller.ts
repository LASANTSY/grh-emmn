import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';

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
