import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { AlertasRepository } from './alertas.repository';
import { ZonasRepository } from './zonas.repository';
import { ParametrosAlertaRepository } from './parametros-alerta.repository';
import { NotificacionesRepository } from './notificaciones.repository';
import { DispositivosModule } from '../dispositivos/dispositivos.module';

@Module({
  imports: [DbModule, forwardRef(() => DispositivosModule)],
  controllers: [AlertasController],
  providers: [
    AlertasService,
    AlertasRepository,
    ZonasRepository,
    ParametrosAlertaRepository,
    NotificacionesRepository,
  ],
  exports: [
    AlertasService,
    AlertasRepository,
    ZonasRepository,
    ParametrosAlertaRepository,
    NotificacionesRepository,
  ],
})
export class AlertasModule {}
