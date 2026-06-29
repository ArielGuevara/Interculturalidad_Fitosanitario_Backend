import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { AlertasRepository } from './alertas.repository';
import { DispositivosModule } from '../dispositivos/dispositivos.module';

@Module({
  imports: [DbModule, forwardRef(() => DispositivosModule)],
  controllers: [AlertasController],
  providers: [AlertasService, AlertasRepository],
  exports: [AlertasService, AlertasRepository],
})
export class AlertasModule {}
