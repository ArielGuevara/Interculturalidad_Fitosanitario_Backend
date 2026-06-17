import { Module } from '@nestjs/common';
import { RecomendacionesController } from './recomendaciones.controller';
import { RecomendacionesService }    from './recomendaciones.service';
import { RecomendacionesRepository } from './recomendaciones.repository';

@Module({
  controllers: [RecomendacionesController],
  providers:   [RecomendacionesService, RecomendacionesRepository],
  exports:     [RecomendacionesService],
})
export class RecomendacionesModule {}
