import { Module } from '@nestjs/common';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UtilisateursController],
  providers: [UtilisateursService],
  exports: [UtilisateursService],
})
export class UtilisateursModule {}
