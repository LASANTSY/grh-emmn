import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  @Get()
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE')
  async lister(
    @Query('action') action?: string,
    @Query('entite') entite?: string,
    @Query('personnelId') personnelId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const tailleMax = 200;
    const taille = Math.min(Math.max(Number(pageSize) || 50, 1), tailleMax);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * taille;

    const ou: Prisma.EntreeAuditWhereInput = {};
    if (action) ou.action = action as never;
    if (entite) ou.entite = entite;
    if (personnelId) ou.personnelId = personnelId;
    if (dateDebut || dateFin) {
      ou.dateHeure = {
        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
        ...(dateFin ? { lte: new Date(dateFin) } : {}),
      };
    }

    if (user && user.typeCompte === 'RH_BASE') {
      const { baseIds } = await this.scope.perimetre(user);
      if (baseIds !== 'TOUTES') {
        ou.OR = [
          { personnel: { unite: { baseId: { in: baseIds } } } },
          { compte: { unite: { baseId: { in: baseIds } } } },
        ];
      }
    }

    const [total, lignes] = await Promise.all([
      this.prisma.entreeAudit.count({ where: ou }),
      this.prisma.entreeAudit.findMany({
        where: ou,
        orderBy: { dateHeure: 'desc' },
        skip: offset,
        take: taille,
        include: {
          compte: { select: { identifiant: true, typeCompte: true } },
          personnel: { select: { nom: true, prenoms: true, matriculeRecrutement: true } },
        },
      }),
    ]);
    return { total, page: offset / taille + 1, pageSize: taille, lignes };
  }

  @Get('export')
  @Roles('ADMIN_SYSTEME', 'RH_ETAT_MAJOR')
  async export(@CurrentUser() user?: RequestUser, @Res() res?: Response): Promise<void> {
    const { baseIds } = await this.scope.perimetre(user!);
    const ou: Prisma.EntreeAuditWhereInput = baseIds === 'TOUTES'
      ? {}
      : {
          OR: [
            { personnel: { unite: { baseId: { in: baseIds } } } },
            { compte: { unite: { baseId: { in: baseIds } } } },
          ],
        };
    const lignes = await this.prisma.entreeAudit.findMany({
      where: ou,
      orderBy: { dateHeure: 'desc' },
      take: 5000,
      include: {
        compte: { select: { identifiant: true, typeCompte: true } },
        personnel: { select: { nom: true, prenoms: true, matriculeRecrutement: true } },
      },
    });

    const echapper = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      return `"${String(v).replace(/"/g, '""')}"`;
    };
    const colonnes = ['Date', 'Heure', 'Action', 'Entité', 'Entité id', 'Champ', 'Ancienne valeur', 'Nouvelle valeur', 'Acteur', 'Personnel', 'IP'];
    const lignesCsv = lignes.map((l) => [
      l.dateHeure.toISOString().slice(0, 10),
      l.dateHeure.toISOString().slice(11, 19),
      l.action,
      l.entite,
      l.entiteId,
      l.champModifie,
      l.ancienneValeur,
      l.nouvelleValeur,
      l.compte?.identifiant,
      l.personnel ? `${l.personnel.nom} ${l.personnel.prenoms}` : null,
      l.ip,
    ].map(echapper).join(';'));

    const csv = '\uFEFF' + colonnes.join(';') + '\n' + lignesCsv.join('\n');
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="audit_${new Date().toISOString().slice(0, 10)}.csv"`);
    res!.send(csv);
  }
}
export type _AuditService = typeof AuditService;