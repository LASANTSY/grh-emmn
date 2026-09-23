import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PersonnelOngletsService } from './personnel-onglets.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { AppError } from '../../common/errors/app-error';
import {
  affectationSchema,
  competenceLinguistiqueSchema,
  cursusScolaireSchema,
  decorationSchema,
  enfantSchema,
  historiqueGradeSchema,
  stageMilitaireSchema,
} from '@grh/validation';
import { z } from 'zod';

type ModelType =
  | 'enfant' | 'historiqueGrade' | 'cursusScolaire' | 'stageMilitaire'
  | 'competenceLinguistique' | 'affectation' | 'decoration';

function valider(schema: z.AnyZodObject, body: unknown): Record<string, unknown> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw AppError.conflict('VALIDATION_ERROR', issue.message);
  }
  const { id: _id, ...donnees } = parsed.data;
  return donnees as Record<string, unknown>;
}

@ApiTags('personnel-onglets')
@Controller('personnel/:personnelId')
export class PersonnelOngletsController {
  constructor(private readonly service: PersonnelOngletsService) {}

  @Post('enfants')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerEnfant(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'enfant', valider(enfantSchema, body), u);
  }
  @Patch('enfants/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierEnfant(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'enfant', valider(enfantSchema, body), u);
  }
  @Delete('enfants/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerEnfant(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'enfant', u);
  }

  @Post('historique-grades')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerGrade(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'historiqueGrade', valider(historiqueGradeSchema, body), u);
  }
  @Patch('historique-grades/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierGrade(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'historiqueGrade', valider(historiqueGradeSchema, body), u);
  }
  @Delete('historique-grades/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerGrade(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'historiqueGrade', u);
  }

  @Post('cursus')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerCursus(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'cursusScolaire', valider(cursusScolaireSchema, body), u);
  }
  @Patch('cursus/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierCursus(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'cursusScolaire', valider(cursusScolaireSchema, body), u);
  }
  @Delete('cursus/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerCursus(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'cursusScolaire', u);
  }

  @Post('stages')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerStage(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'stageMilitaire', valider(stageMilitaireSchema, body), u);
  }
  @Patch('stages/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierStage(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'stageMilitaire', valider(stageMilitaireSchema, body), u);
  }
  @Delete('stages/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerStage(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'stageMilitaire', u);
  }

  @Post('langues')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerLangue(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'competenceLinguistique', valider(competenceLinguistiqueSchema, body), u);
  }
  @Patch('langues/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierLangue(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'competenceLinguistique', valider(competenceLinguistiqueSchema, body), u);
  }
  @Delete('langues/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerLangue(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'competenceLinguistique', u);
  }

  @Post('affectations')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerAffectation(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'affectation', valider(affectationSchema, body), u);
  }
  @Patch('affectations/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierAffectation(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'affectation', valider(affectationSchema, body), u);
  }
  @Delete('affectations/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerAffectation(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'affectation', u);
  }

  @Post('decorations')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  creerDecoration(@Param('personnelId') pid: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.creerRelation(pid, 'decoration', valider(decorationSchema, body), u);
  }
  @Patch('decorations/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  modifierDecoration(@Param('personnelId') pid: string, @Param('id') id: string, @Body() body: unknown, @CurrentUser() u: RequestUser) {
    return this.service.modifierRelation(pid, id, 'decoration', valider(decorationSchema, body), u);
  }
  @Delete('decorations/:id')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  supprimerDecoration(@Param('personnelId') pid: string, @Param('id') id: string, @CurrentUser() u: RequestUser) {
    return this.service.supprimerRelation(pid, id, 'decoration', u);
  }
}