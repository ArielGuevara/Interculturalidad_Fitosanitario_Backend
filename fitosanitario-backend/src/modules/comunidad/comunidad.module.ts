import { Module } from '@nestjs/common';
import { ComunidadService } from './comunidad.service';
import { ComunidadController } from './comunidad.controller';
import { ComunidadRepository } from './comunidad.repository';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [ReportesModule],
  controllers: [ComunidadController],
  providers: [ComunidadService, ComunidadRepository],
  exports: [ComunidadService],
})
export class ComunidadModule {}
