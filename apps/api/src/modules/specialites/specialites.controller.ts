import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SpecialitesService } from './specialites.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { specialiteSchema } from '@grh/validation';

@ApiTags('referentiel-specialites')
@Controller('specialites')
export class SpecialitesController {
  constructor(private readonly specialites: SpecialitesService) {}

  @Get()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  lister(): Promise<unknown[]> {
    return this.specialites.lister();
  }

  @Post()
  @Roles('ADMIN_SYSTEME')
  creer(@Body() body: unknown, @CurrentUser() user: RequestUser) {
    return this.specialites.creer(specialiteSchema.parse(body), user.compteId);
  }

  @Patch(':id')
  @Roles('ADMIN_SYSTEME')
  modifier(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
    return this.specialites.modifier(id, specialiteSchema.parse(body), user.compteId);
  }

  @Delete(':id')
  @Roles('ADMIN_SYSTEME')
  async supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.specialites.supprimer(id, user.compteId);
    return { ok: true };
  }
}
