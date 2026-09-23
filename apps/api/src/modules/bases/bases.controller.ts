import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BasesService } from './bases.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { baseSchema } from '@grh/validation';

@ApiTags('referentiel-bases')
@Controller('bases')
export class BasesController {
  constructor(private readonly bases: BasesService) {}

  @Get()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  lister(): Promise<unknown[]> {
    return this.bases.lister();
  }

  @Post()
  @Roles('ADMIN_SYSTEME')
  creer(@Body() body: unknown, @CurrentUser() user: RequestUser): Promise<unknown> {
    const data = baseSchema.parse(body);
    return this.bases.creer(data, user.compteId);
  }

  @Patch(':id')
  @Roles('ADMIN_SYSTEME')
  modifier(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
    const data = baseSchema.parse(body);
    return this.bases.modifier(id, data, user.compteId);
  }

  @Delete(':id')
  @Roles('ADMIN_SYSTEME')
  async supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.bases.supprimer(id, user.compteId);
    return { ok: true };
  }
}