import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class SpecialitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister() {
    return this.prisma.specialite.findMany({ orderBy: { libelle: 'asc' } });
  }

  async creer(data: { libelle: string }, compteId: string) {
    const spec = await this.prisma.specialite.create({ data });
    await this.audit.log({
      compteId, action: 'CREATION', entite: 'Specialite', entiteId: spec.id, nouvelleValeur: spec.libelle,
    });
    return spec;
  }

  async modifier(id: string, data: { libelle?: string }, compteId: string) {
    const existante = await this.prisma.specialite.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('SPECIALITE_NOT_FOUND', 'Spécialité introuvable.');
    const maj = await this.prisma.specialite.update({ where: { id }, data });
    await this.audit.log({
      compteId, action: 'MODIFICATION', entite: 'Specialite', entiteId: id, nouvelleValeur: maj.libelle,
    });
    return maj;
  }

  async supprimer(id: string, compteId: string): Promise<void> {
    const existante = await this.prisma.specialite.findUnique({ where: { id } });
    if (!existante) throw AppError.notFound('SPECIALITE_NOT_FOUND', 'Spécialité introuvable.');
    try {
      await this.prisma.specialite.delete({ where: { id } });
    } catch {
      throw AppError.conflict('SPECIALITE_EN_UTILISATION', 'Des personnels possèdent cette spécialité.');
    }
    await this.audit.log({ compteId, action: 'SUPPRESSION', entite: 'Specialite', entiteId: id });
  }
}
