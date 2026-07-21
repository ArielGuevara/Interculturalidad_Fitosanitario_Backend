import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { NotificacionesRepository } from '../alertas/notificaciones.repository';
import { NotificationEventService } from '../notifications/notification-event.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly repo: UsuariosRepository,
    private readonly notificacionesRepo: NotificacionesRepository,
    private readonly notificationEvent: NotificationEventService,
  ) {}

  async findAll(rol?: string) {
    if (rol) {
      return this.repo.findByRole([rol]);
    }
    return this.repo.findAll();
  }

  async findById(id: number) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: number, data: { nombre?: string; email?: string; telefono?: string; cargo?: string; rol?: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN'; permisos?: string[]; activo?: boolean }) {
    const user = await this.findById(id);
    if (data.email && data.email !== user.email) {
      const existing = await this.repo.findByEmail(data.email);
      if (existing) throw new BadRequestException('El email ya está en uso');
    }
    return this.repo.update(id, data);
  }

  async logicalDelete(id: number) {
    await this.findById(id);
    return this.repo.update(id, { activo: false });
  }

  async restore(id: number) {
    await this.findById(id);
    return this.repo.update(id, { activo: true });
  }

  async createModerator(data: {
    nombre: string;
    email: string;
    telefono?: string;
    cargo?: string;
    permisos?: string[];
  }) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new BadRequestException('El email ya está registrado');

    const passwordHash = await bcrypt.hash('Moderador123', 10);
    return this.repo.create({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono || null,
      passwordHash,
      rol: 'MODERADOR',
      cargo: data.cargo || null,
      permisos: data.permisos || [],
    });
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('La contraseña actual no es correcta');

    if (newPassword.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(userId, passwordHash);
  }

  async suspenderUsuario(params: {
    usuarioId: number;
    motivo: string;
    tipoDuracion: 'TIEMPO' | 'DIAS';
    duracion: number;
  }) {
    if (params.tipoDuracion === 'TIEMPO' && params.duracion < 10) {
      throw new BadRequestException('La duración en segundos debe ser al menos 10');
    }

    const now = new Date();
    const fechaFin = params.tipoDuracion === 'TIEMPO'
      ? new Date(now.getTime() + params.duracion * 1000)
      : new Date(now.getTime() + params.duracion * 24 * 60 * 60 * 1000);

    const suspension = await this.repo.createSuspension({
      usuarioId: params.usuarioId,
      motivo: params.motivo,
      tipoDuracion: params.tipoDuracion,
      duracion: params.duracion,
      fechaFin,
    });

    await this.notificationEvent.notifyUser(
      params.usuarioId,
      'Cuenta suspendida',
      `Tu cuenta ha sido suspendida hasta ${fechaFin.toLocaleDateString()}. Motivo: ${params.motivo}`,
      { type: 'cuenta_suspendida', suspensionId: suspension.id },
    );

    return suspension;
  }

  async reactivarUsuario(usuarioId: number) {
    const suspension = await this.repo.findSuspensionActiva(usuarioId);
    if (!suspension) throw new BadRequestException('El usuario no tiene una suspensión activa');

    await this.repo.desactivarSuspension(suspension.id);

    await this.notificationEvent.notifyUser(
      usuarioId,
      'Cuenta reactivada',
      'Tu cuenta ha sido reactivada. Ya puedes usar la aplicación nuevamente.',
      { type: 'cuenta_reactivada' },
    );

    return { message: 'Usuario reactivado exitosamente' };
  }

  async getSuspensionActiva(usuarioId: number) {
    await this.repo.desactivarSuspensionesExpiradas();
    return this.repo.findSuspensionActiva(usuarioId);
  }

  async findAllActiveSuspensions() {
    return this.repo.findAllActiveSuspensions();
  }
}
