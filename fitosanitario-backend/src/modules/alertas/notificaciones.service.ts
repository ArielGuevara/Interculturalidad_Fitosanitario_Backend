import { Injectable } from '@nestjs/common';
import { NotificacionesRepository } from './notificaciones.repository';

@Injectable()
export class NotificacionesService {
  constructor(private readonly repo: NotificacionesRepository) {}

  findByUser(usuarioId: number) {
    return this.repo.findByUser(usuarioId);
  }

  countNoLeidas(usuarioId: number) {
    return this.repo.countNoLeidas(usuarioId);
  }

  marcarLeida(id: number) {
    return this.repo.marcarLeida(id);
  }
}
