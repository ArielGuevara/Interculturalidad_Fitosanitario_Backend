import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DbModule } from '../../db/db.module';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { AlertasTask } from './alertas-task.service';
import { AlertasRepository } from './alertas.repository';
import { ZonasRepository } from './zonas.repository';
import { ParametrosAlertaRepository } from './parametros-alerta.repository';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesRepository } from './notificaciones.repository';
import { DispositivosModule } from '../dispositivos/dispositivos.module';

@Module({
  imports: [ScheduleModule.forRoot(), DbModule, forwardRef(() => DispositivosModule)],
  controllers: [AlertasController, NotificacionesController],
  providers: [
    AlertasService,
    AlertasTask,
    AlertasRepository,
    ZonasRepository,
    ParametrosAlertaRepository,
    NotificacionesService,
    NotificacionesRepository,
  ],
  exports: [
    AlertasService,
    AlertasRepository,
    ZonasRepository,
    ParametrosAlertaRepository,
    NotificacionesService,
    NotificacionesRepository,
  ],
})
export class AlertasModule {}
