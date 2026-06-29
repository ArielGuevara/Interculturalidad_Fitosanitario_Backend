import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { DispositivosController } from './dispositivos.controller';
import { DispositivosService } from './dispositivos.service';
import { DispositivosRepository } from './dispositivos.repository';

@Module({
  imports: [DbModule],
  controllers: [DispositivosController],
  providers: [DispositivosService, DispositivosRepository],
  exports: [DispositivosService, DispositivosRepository],
})
export class DispositivosModule {}
