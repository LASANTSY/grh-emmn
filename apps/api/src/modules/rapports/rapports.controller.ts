import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RapportsService } from './rapports.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import type { RechercheParams } from '../personnel/personnel.service';

@ApiTags('rapports')
@Controller('rapports')
export class RapportsController {
  constructor(private readonly rapports: RapportsService) {}

  @Get('personnel-excel')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  async excel(@Query() params: RechercheParams, @CurrentUser() user: RequestUser, @Res() res: Response): Promise<void> {
    const { buffer, nom } = await this.rapports.exporterExcel(user, params);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(buffer);
  }

  @Get('effectifs-pdf')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT')
  async pdf(@CurrentUser() user: RequestUser, @Res() res: Response): Promise<void> {
    const { buffer, nom } = await this.rapports.rapportPdf(user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(buffer);
  }
}
