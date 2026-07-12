import { Injectable } from '@nestjs/common';
import { NotificacionesRepository } from '../alertas/notificaciones.repository';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { PushService } from './push.service';

@Injectable()
export class NotificationEventService {
  constructor(
    private readonly notificacionesRepo: NotificacionesRepository,
    private readonly dispositivosRepo: DispositivosRepository,
    private readonly usuariosRepo: UsuariosRepository,
    private readonly pushService: PushService,
  ) {}

  async notifyUser(usuarioId: number, titulo: string, cuerpo: string, data?: Record<string, any>) {
    await this.notificacionesRepo.create({ usuarioId, titulo, cuerpo });

    const dispositivos = await this.dispositivosRepo.findByUser(usuarioId);
    const tokens = dispositivos.map((d) => d.token);
    if (tokens.length > 0) {
      await this.pushService.sendToTokens(tokens, titulo, cuerpo, data);
    }
  }

  async notifyRole(roles: string[], titulo: string, cuerpo: string, data?: Record<string, any>) {
    const usuarios = await this.usuariosRepo.findByRole(roles);
    for (const usuario of usuarios) {
      await this.notifyUser(usuario.id, titulo, cuerpo, data);
    }
  }
}
