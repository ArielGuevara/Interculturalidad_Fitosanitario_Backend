import { Module, Global } from '@nestjs/common';
import { PushService } from './push.service';
import { NotificationEventService } from './notification-event.service';
import { AlertasModule } from '../alertas/alertas.module';
import { DispositivosModule } from '../dispositivos/dispositivos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Global()
@Module({
  imports: [AlertasModule, DispositivosModule, UsuariosModule],
  providers: [PushService, NotificationEventService],
  exports: [PushService, NotificationEventService],
})
export class NotificationsModule {}
