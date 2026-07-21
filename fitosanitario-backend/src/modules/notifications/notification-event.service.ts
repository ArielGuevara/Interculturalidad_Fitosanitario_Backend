import { Injectable, Logger } from '@nestjs/common';
import { NotificacionesRepository } from '../alertas/notificaciones.repository';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { PushService } from './push.service';

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly notificacionesRepo: NotificacionesRepository,
    private readonly dispositivosRepo: DispositivosRepository,
    private readonly usuariosRepo: UsuariosRepository,
    private readonly pushService: PushService,
  ) {}

  async notifyUser(usuarioId: number, titulo: string, cuerpo: string, data?: Record<string, any>) {
    const tipo = data?.type ?? null;
    const alertaId = data?.alertaId ?? null;
    const storedData = data ? JSON.stringify(data) : null;
    await this.notificacionesRepo.create({ usuarioId, titulo, cuerpo, tipo, alertaId, data: storedData });

    const dispositivos = await this.dispositivosRepo.findByUser(usuarioId);
    const tokens = dispositivos.map((d) => d.token);
    if (tokens.length > 0) {
      await this.pushService.sendToTokens(tokens, titulo, cuerpo, data);
    }
  }

  async notifyRole(roles: string[], titulo: string, cuerpo: string, data?: Record<string, any>) {
    const usuarios = await this.usuariosRepo.findByRole(roles);
    for (const usuario of usuarios) {
      try {
        await this.notifyUser(usuario.id, titulo, cuerpo, data);
      } catch (err) {
        this.logger.error(`Error notificando a usuario ${usuario.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }
}
