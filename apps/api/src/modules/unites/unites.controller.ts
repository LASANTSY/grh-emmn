import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UnitesService } from './unites.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { uniteSchema } from '@grh/validation';

@ApiTags('referentiel-unites')
@Controller('unites')
export class UnitesController {
  constructor(private readonly unites: UnitesService) {}

  @Get()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  lister(@Query('baseId') baseId?: string): Promise<unknown[]> {
    return this.unites.lister(baseId);
  }

  @Post()
  @Roles('ADMIN_SYSTEME')
  creer(@Body() body: unknown, @CurrentUser() user: RequestUser) {
    return this.unites.creer(uniteSchema.parse(body), user.compteId);
  }

  @Patch(':id')
  @Roles('ADMIN_SYSTEME')
  modifier(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
    return this.unites.modifier(id, uniteSchema.parse(body), user.compteId);
  }

  @Delete(':id')
  @Roles('ADMIN_SYSTEME')
  async supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.unites.supprimer(id, user.compteId);
    return { ok: true };
  }
}