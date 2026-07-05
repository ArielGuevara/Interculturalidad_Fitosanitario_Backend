import { Module } from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { TratamientosController } from './tratamientos.controller';
import { TratamientosRepository } from './tratamientos.repository';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [ReportesModule],
  controllers: [TratamientosController],
  providers: [TratamientosService, TratamientosRepository],
  exports: [TratamientosService],
})
export class TratamientosModule {}
