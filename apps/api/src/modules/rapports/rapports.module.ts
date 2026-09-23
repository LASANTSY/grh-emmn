import { Module } from '@nestjs/common';
import { RapportsController } from './rapports.controller';
import { RapportsService } from './rapports.service';
import { PersonnelModule } from '../personnel/personnel.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [PersonnelModule, DashboardModule],
  controllers: [RapportsController],
  providers: [RapportsService],
  exports: [RapportsService],
})
export class RapportsModule {}
