import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';
import type { GradeCategorie } from '@prisma/client';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister() {
    return this.prisma.grade.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] });
  }

  async creer(
    data: { libelle: string; categorie: GradeCategorie; ageDepartRetraite: number; ordre?: number },
    compteId: string,
  ) {
    const grade = await this.prisma.grade.create({
      data: { ...data, ordre: data.ordre ?? 0 },
    });
    await this.audit.log({
      compteId, action: 'CREATION', entite: 'Grade', entiteId: grade.id, nouvelleValeur: grade.libelle,
    });
    return grade;
  }

  async modifier(
    id: string,
    data: { libelle?: string; categorie?: GradeCategorie; ageDepartRetraite?: number; ordre?: number },
    compteId: string,
  ) {
    const existant = await this.prisma.grade.findUnique({ where: { id } });
    if (!existant) throw AppError.notFound('GRADE_NOT_FOUND', 'Grade introuvable.');
    const maj = await this.prisma.grade.update({ where: { id }, data });
    await this.audit.log({
      compteId, action: 'MODIFICATION', entite: 'Grade', entiteId: id, nouvelleValeur: maj.libelle,
    });
    return maj;
  }

  async supprimer(id: string, compteId: string): Promise<void> {
    const existant = await this.prisma.grade.findUnique({ where: { id } });
    if (!existant) throw AppError.notFound('GRADE_NOT_FOUND', 'Grade introuvable.');
    try {
      await this.prisma.grade.delete({ where: { id } });
    } catch {
      throw AppError.conflict('GRADE_EN_UTILISATION', 'Des personnels possèdent ce grade.');
    }
    await this.audit.log({ compteId, action: 'SUPPRESSION', entite: 'Grade', entiteId: id });
  }
}
