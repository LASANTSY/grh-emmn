import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { StorageModule } from './common/storage/storage.module';
import { ScopeModule } from './common/scope/scope.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { BasesModule } from './modules/bases/bases.module';
import { UnitesModule } from './modules/unites/unites.module';
import { GradesModule } from './modules/grades/grades.module';
import { SpecialitesModule } from './modules/specialites/specialites.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DemandesModule } from './modules/demandes/demandes.module';
import { UtilisateursModule } from './modules/utilisateurs/utilisateurs.module';
import { ImportsModule } from './modules/imports/imports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditControllerModule } from './modules/audit/audit.module';
import { RapportsModule } from './modules/rapports/rapports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    StorageModule,
    ScopeModule,
    AuthModule,
    BasesModule,
    UnitesModule,
    GradesModule,
    SpecialitesModule,
    PersonnelModule,
    DocumentsModule,
    DemandesModule,
    UtilisateursModule,
    ImportsModule,
    DashboardModule,
    AuditControllerModule,
    RapportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}