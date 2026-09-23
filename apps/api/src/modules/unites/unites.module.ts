import { Module } from '@nestjs/common';
import { UnitesController } from './unites.controller';
import { UnitesService } from './unites.service';

@Module({
  controllers: [UnitesController],
  providers: [UnitesService],
  exports: [UnitesService],
})
export class UnitesModule {}
