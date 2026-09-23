import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemandesService } from './demandes.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';

@ApiTags('demandes')
@Controller('demandes')
export class DemandesController {
  constructor(private readonly demandes: DemandesService) {}

  @Get()
  @Roles('PERSONNEL', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'ADMIN_SYSTEME')
  lister(@CurrentUser() user: RequestUser) {
    return this.demandes.lister(user);
  }

  @Post()
  @Roles('PERSONNEL', 'RH_ETAT_MAJOR', 'RH_BASE')
  creer(@Body() body: {
    personnelId: string;
    champModifie: string;
    ancienneValeur?: string;
    nouvelleValeur?: string;
    commentaire?: string;
  }, @CurrentUser() user: RequestUser) {
    if (!body.personnelId || !body.champModifie) {
      throw AppError.conflict('VALIDATION_ERROR', 'personnelId et champModifie sont requis.');
    }
    return this.demandes.creer(user, body);
  }

  @Patch(':id/valider')
  @Roles('RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'ADMIN_SYSTEME')
  async valider(@Param('id') id: string, @Body() body: { commentaire?: string }, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.demandes.valider(id, user, body.commentaire);
    return { ok: true };
  }

  @Patch(':id/rejeter')
  @Roles('RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'ADMIN_SYSTEME')
  async rejeter(@Param('id') id: string, @Body() body: { motif?: string }, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.demandes.rejeter(id, body.motif ?? '', user);
    return { ok: true };
  }
}
