import { Module } from '@nestjs/common';
import { CultivosService }    from './cultivos.service';
import { CultivosController } from './cultivos.controller';
import { CultivosRepository } from './cultivos.repository';

@Module({
  controllers: [CultivosController],
  providers:   [CultivosService, CultivosRepository],
  exports:     [CultivosService],
})
export class CultivosModule {}