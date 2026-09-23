import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportsService } from './imports.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';

@ApiTags('imports-exports')
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get('gabarit')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  async gabarit(@Res() res: Response): Promise<void> {
    const { buffer, nom } = await this.imports.gabarit();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(buffer);
  }

  @Post()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  @UseInterceptors(FileInterceptor('fichier'))
  analyser(
    @UploadedFile() fichier: { buffer: Buffer; originalname: string } | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!fichier) throw AppError.conflict('FICHIER_MANQUANT', 'Aucun fichier envoyé.');
    return this.imports.analyser(fichier.buffer, fichier.originalname, user);
  }

  @Post(':id/valider')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  valider(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.imports.confirmer(id, user);
  }

  @Get('historique')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  historique() {
    return this.imports.historique();
  }
}
