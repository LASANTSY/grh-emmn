import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';

@ApiTags('documents')
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('personnel/:personnelId/pieces-jointes')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'PERSONNEL')
  @UseInterceptors(FileInterceptor('fichier'))
  uploader(
    @Param('personnelId') personnelId: string,
    @Body('type') type: string,
    @UploadedFile() fichier: { buffer: Buffer; originalname: string; mimetype: string } | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!fichier) throw AppError.conflict('FICHIER_MANQUANT', 'Aucun fichier envoyé.');
    return this.documents.uploader(
      personnelId,
      type || 'document',
      { buffer: fichier.buffer, originalname: fichier.originalname, mimeType: fichier.mimetype },
      user,
    );
  }

  @Get('personnel/:personnelId/pieces-jointes')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  lister(@Param('personnelId') personnelId: string, @CurrentUser() user: RequestUser) {
    return this.documents.lister(personnelId, user);
  }

  @Get('pieces-jointes/:id/telecharger')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  async telecharger(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ): Promise<void> {
    const resultat = await this.documents.telecharger(id, user, false);
    res.setHeader('Content-Type', resultat.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="pj-${id}.${resultat.mimeType.split('/')[1] ?? 'bin'}"`,
    );
    res.send(resultat.buffer);
  }

  @Get('pieces-jointes/:id/preview')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL')
  async preview(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ): Promise<void> {
    const resultat = await this.documents.telecharger(id, user, true);
    res.setHeader('Content-Type', resultat.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.send(resultat.buffer);
  }

  @Post('pieces-jointes/:id/versions')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'PERSONNEL')
  @UseInterceptors(FileInterceptor('fichier'))
  nouvelleVersion(
    @Param('id') id: string,
    @UploadedFile() fichier: { buffer: Buffer; originalname: string; mimetype: string } | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!fichier) throw AppError.conflict('FICHIER_MANQUANT', 'Aucun fichier envoyé.');
    return this.documents.ajouterVersion(
      id,
      { buffer: fichier.buffer, originalname: fichier.originalname, mimeType: fichier.mimetype },
      user,
    );
  }

  @Delete('pieces-jointes/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  async supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    await this.documents.supprimer(id, user);
    return { ok: true };
  }
}