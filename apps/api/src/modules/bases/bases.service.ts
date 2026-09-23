import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class BasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(): Promise<unknown[]> {
    return this.prisma.base.findMany({
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
      include: {
        unites: { orderBy: [{ ordre: 'asc' }, { nom: 'asc' }] },
      },
    });
  }

  async creer(data: { nom: string; ville?: string | null; code?: string | null }, compteId: string) {
    const base = await this.prisma.base.create({ data });
    await this.audit.log({
      compteId, action: 'CREATION', entite: 'Base', entiteId: base.id,
      nouvelleValeur: base.nom,
    });
    return base;
  }

  async modifier(
    id: string,
    data: { nom?: string; ville?: string | null; code?: string | null },
    compteId: string,
  ) {
    const existante = await this.prisma.base.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('BASE_NOT_FOUND', 'Base introuvable.');
    const maj = await this.prisma.base.update({ where: { id }, data });
    await this.audit.log({
      compteId, action: 'MODIFICATION', entite: 'Base', entiteId: id, nouvelleValeur: maj.nom,
    });
    return maj;
  }

  async supprimer(id: string, compteId: string): Promise<void> {
    const existante = await this.prisma.base.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('BASE_NOT_FOUND', 'Base introuvable.');
    try {
      await this.prisma.base.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw AppError.conflict('BASE_EN_UTILISATION', 'Des unités sont rattachées à cette base.');
      }
      throw e;
    }
    await this.audit.log({ compteId, action: 'SUPPRESSION', entite: 'Base', entiteId: id });
  }
}