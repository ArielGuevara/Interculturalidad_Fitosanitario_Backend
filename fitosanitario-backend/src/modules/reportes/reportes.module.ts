import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesRepository } from './reportes.repository';
import { MultimediaModule } from '../multimedia/multimedia.module';
import { SuspensionGuard } from '../../common/guards/suspension.guard';

@Module({
  imports: [MultimediaModule],
  controllers: [ReportesController],
  providers: [ReportesService, ReportesRepository, SuspensionGuard],
  exports: [ReportesService, SuspensionGuard],
})
export class ReportesModule {}
