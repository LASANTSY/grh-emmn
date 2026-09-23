import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PersonnelOngletsController } from './personnel-onglets.controller';
import { PersonnelService } from './personnel.service';
import { PersonnelOngletsService } from './personnel-onglets.service';

@Module({
  controllers: [PersonnelController, PersonnelOngletsController],
  providers: [PersonnelService, PersonnelOngletsService],
  exports: [PersonnelService],
})
export class PersonnelModule {}