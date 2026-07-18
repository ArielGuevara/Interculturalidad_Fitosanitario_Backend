import { Module } from '@nestjs/common';
import { RecomendacionesController } from './recomendaciones.controller';
import { RecomendacionesService } from './recomendaciones.service';
import { RecomendacionesRepository } from './recomendaciones.repository';
import { ReportesModule } from '../reportes/reportes.module';
import { SuspensionGuard } from '../../common/guards/suspension.guard';

@Module({
  imports: [ReportesModule],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService, RecomendacionesRepository, SuspensionGuard],
  exports: [RecomendacionesService],
})
export class RecomendacionesModule {}
