import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class UnitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(baseId?: string): Promise<unknown[]> {
    return this.prisma.unite.findMany({
      where: baseId ? { baseId } : undefined,
      orderBy: [{ baseId: 'asc' }, { ordre: 'asc' }, { nom: 'asc' }],
      include: { base: true },
    });
  }

  async creer(
    data: { nom: string; code?: string | null; baseId: string; ordre?: number },
    compteId: string,
  ) {
    const base = await this.prisma.base.findUnique({ where: { id: data.baseId } });
    if (!base) throw AppError.notFound('BASE_NOT_FOUND', 'Base introuvable.');
    const unite = await this.prisma.unite.create({ data, include: { base: true } });
    await this.audit.log({
      compteId, action: 'CREATION', entite: 'Unite', entiteId: unite.id, nouvelleValeur: unite.nom,
    });
    return unite;
  }

  async modifier(
    id: string,
    data: { nom?: string; code?: string | null; baseId?: string; ordre?: number },
    compteId: string,
  ) {
    const existante = await this.prisma.unite.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('UNITE_NOT_FOUND', 'Unité introuvable.');
    const maj = await this.prisma.unite.update({ where: { id }, data, include: { base: true } });
    await this.audit.log({
      compteId, action: 'MODIFICATION', entite: 'Unite', entiteId: id, nouvelleValeur: maj.nom,
    });
    return maj;
  }

  async supprimer(id: string, compteId: string): Promise<void> {
    const existante = await this.prisma.unite.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('UNITE_NOT_FOUND', 'Unité introuvable.');
    try {
      await this.prisma.unite.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw AppError.conflict(
          'UNITE_EN_UTILISATION',
          "Des personnels ou comptes sont rattachés à cette unité.",
        );
      }
      throw e;
    }
    await this.audit.log({ compteId, action: 'SUPPRESSION', entite: 'Unite', entiteId: id });
  }
}