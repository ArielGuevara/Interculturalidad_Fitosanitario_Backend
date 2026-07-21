import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RecomendacionesRepository } from './recomendaciones.repository';
import {
  CreateRecomendacionDto,
  CreateValoracionDto,
} from './dto/create-recomendacion.dto';
import { ModerarRecomendacionDto } from './dto/moderar-recomendacion.dto';
import { PromoverComentarioDto } from './dto/promover-comentario.dto';
import { NotificationEventService } from '../notifications/notification-event.service';

function calcularFechaExpiracion(duracionDias: number): Date {
  const fecha = new Date();
  let diasAgregados = 0;
  while (diasAgregados < duracionDias) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  return fecha;
}

@Injectable()
export class RecomendacionesService {
  private readonly logger = new Logger(RecomendacionesService.name);

  constructor(
    private readonly repo: RecomendacionesRepository,
    private readonly notificationEvent: NotificationEventService,
  ) {}

  async create(dto: CreateRecomendacionDto, usuarioId: number) {
    const recomendacion = await this.repo.create(dto, usuarioId);

    if (!recomendacion.moderado) {
      await this.notificationEvent.notifyRole(
        ['MODERADOR', 'ADMIN'],
        'Nuevo foro pendiente',
        `"${recomendacion.titulo}" está pendiente de revisión`,
        { type: 'nuevo_foro_pendiente', recomendacionId: recomendacion.id },
      );
    }

    return recomendacion;
  }

  findAll(filtros?: { tipo?: string; cultivoId?: number; plagaId?: number; moderado?: boolean }) {
    return this.repo.findAll(filtros);
  }

  findAllSaberes(filtros?: {
    q?: string;
    estado?: string;
    cultivoId?: number;
    plagaId?: number;
  }, usuarioId?: number) {
    return this.repo.findAllSaberes(filtros, usuarioId);
  }

  findByUsuario(usuarioId: number) {
    return this.repo.findByUsuario(usuarioId);
  }

  async findById(id: number) {
    const rec = await this.repo.findById(id);
    if (!rec) {
      throw new NotFoundException(`Recomendación #${id} no encontrada`);
    }
    return rec;
  }

  async update(
    id: number,
    dto: Partial<CreateRecomendacionDto & { fechaExpiracion?: Date | null; duracionDias?: number }>,
    usuarioId: number,
    userRol: string,
  ) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);

    if (rec.usuario?.id !== usuarioId && userRol !== 'MODERADOR') {
      throw new ForbiddenException(
        'No tienes permiso para editar esta recomendación',
      );
    }

    if (userRol === 'MODERADOR' && dto.moderado === true && dto.duracionDias) {
      dto.fechaExpiracion = calcularFechaExpiracion(dto.duracionDias);
    }

    const result = await this.repo.update(id, dto);

    // Si un moderador está moderando un foro (no un saber ancestral)
    if (userRol === 'MODERADOR' && dto.moderado !== undefined && rec.tipo !== 'CONOCIMIENTO_ANCESTRAL') {
      if (dto.moderado) {
        // Foro aprobado — notificar al autor
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Foro aprobado',
          `Tu foro "${rec.titulo}" fue aprobado y ya se encuentra publicado.`,
          { type: 'foro_aprobado', recomendacionId: id },
        );
        // Notificar a todos los agricultores sobre el nuevo foro
        await this.notificationEvent.notifyRole(
          ['AGRICULTOR'],
          `${rec.usuario?.nombre || 'Un agricultor'} publicó un nuevo foro`,
          rec.titulo,
          { type: 'nuevo_foro_publicado', recomendacionId: id },
        );
        this.logger.log(`Foro #${id} aprobado por moderador #${usuarioId}`);
      } else {
        // Foro rechazado — notificar al autor
        const motivo = dto.motivoRechazo || 'El contenido no cumple con las normas de la comunidad.';
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Foro no aprobado',
          `Tu foro "${rec.titulo}" no fue aprobado.\nMotivo: ${motivo}`,
          { type: 'foro_rechazado', recomendacionId: id },
        );
        this.logger.log(`Foro #${id} rechazado por moderador #${usuarioId}: ${motivo}`);
      }
    }

    return result;
  }

  async remove(id: number, usuarioId: number, userRol: string) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);

    if (rec.usuario?.id !== usuarioId && userRol !== 'MODERADOR') {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta recomendación',
      );
    }

    return this.repo.softDelete(id);
  }

  async hardRemove(id: number, usuarioId: number) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);
    // Solo MODERADOR puede eliminar físicamente
    return this.repo.hardDelete(id);
  }

  async moderar(
    id: number,
    dto: ModerarRecomendacionDto,
    moderadorId: number,
  ) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);

    if (dto.moderado) {
      if (!dto.duracionDias || dto.duracionDias < 1) {
        throw new BadRequestException(
          'Debes especificar una duración en días hábiles (mínimo 1)',
        );
      }

      const fechaExpiracion = calcularFechaExpiracion(dto.duracionDias);

      const result = await this.repo.moderate(id, {
        moderado: true,
        moderadorId,
        fechaExpiracion,
      });

      const esSaber = rec.tipo === 'CONOCIMIENTO_ANCESTRAL';
      const nom = rec.usuario?.nombre || `#${rec.usuario?.id}`;

      if (esSaber) {
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Saber ancestral publicado',
          `Tu saber ancestral "${rec.titulo}" ha sido publicado. Estará disponible por ${dto.duracionDias} días hábiles (hasta ${fechaExpiracion.toLocaleDateString('es-EC')}).`,
          { type: 'saber_ancestral_aprobado', recomendacionId: id },
        );
        this.logger.log(`Saber ancestral #${id} aprobado por moderador #${moderadorId}, vence ${fechaExpiracion.toISOString()}`);
      } else {
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Foro aprobado',
          `Tu foro "${rec.titulo}" ha sido aprobado y publicado.`,
          { type: 'foro_aprobado', recomendacionId: id },
        );
        await this.notificationEvent.notifyRole(
          ['AGRICULTOR'],
          'Nuevo foro publicado',
          `${nom} publicó un nuevo foro: "${rec.titulo}"`,
          { type: 'nuevo_foro_publicado', recomendacionId: id },
        );
        this.logger.log(`Foro #${id} aprobado por moderador #${moderadorId}, vence ${fechaExpiracion.toISOString()}`);
      }

      return result;
    } else {
      if (!dto.motivoRechazo || dto.motivoRechazo.trim().length === 0) {
        throw new BadRequestException(
          'Debes escribir un motivo para rechazar la publicación',
        );
      }

      const result = await this.repo.moderate(id, {
        moderado: false,
        moderadorId,
        motivoRechazo: dto.motivoRechazo,
        fechaExpiracion: null,
      });

      const esSaber = rec.tipo === 'CONOCIMIENTO_ANCESTRAL';

      if (esSaber) {
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Saber ancestral rechazado',
          `Tu saber ancestral "${rec.titulo}" fue rechazado. Motivo: ${dto.motivoRechazo}`,
          { type: 'saber_ancestral_rechazado', recomendacionId: id },
        );
        this.logger.log(`Saber ancestral #${id} rechazado por moderador #${moderadorId}: ${dto.motivoRechazo}`);
      } else {
        await this.notificationEvent.notifyUser(
          rec.usuario?.id,
          'Foro rechazado',
          `Tu foro "${rec.titulo}" fue rechazado. Motivo: ${dto.motivoRechazo}`,
          { type: 'foro_rechazado', recomendacionId: id },
        );
        this.logger.log(`Foro #${id} rechazado por moderador #${moderadorId}: ${dto.motivoRechazo}`);
      }

      return result;
    }
  }

  async promoteComment(
    recomendacionId: number,
    comentarioId: number,
    dto: PromoverComentarioDto,
    moderadorId: number,
  ) {
    const rec = await this.repo.findById(recomendacionId);
    if (!rec) throw new NotFoundException(`Recomendación #${recomendacionId} no encontrada`);

    const interacciones = await this.repo.getInteracciones(recomendacionId);
    const comentarios = interacciones.comentarios.flatMap((c: any) => [c, ...(c.respuestas || [])]);
    const comentario = comentarios.find((c: any) => c.id === comentarioId);
    if (!comentario) {
      throw new BadRequestException('Comentario no encontrado en esta publicación');
    }

    const plagaId = rec.plaga?.id || dto.plagaId;
    const cultivoId = rec.cultivo?.id ?? dto.cultivoId ?? null;
    const titulo = rec.plaga?.nombre || (plagaId ? `Plaga #${plagaId}` : 'Saber Ancestral');

    if (!plagaId) {
      throw new BadRequestException('La publicación de origen no tiene una plaga asociada. Selecciona una plaga para promover este comentario.');
    }

    const result = await this.repo.promoteComment({
      comentarioOrigenId: comentarioId,
      usuarioId: comentario.usuario.id,
      plagaId,
      cultivoId,
      titulo,
      solucion: comentario.contenido,
      comentarioModerador: dto.comentarioModerador,
    });

    await this.notificationEvent.notifyUser(
      comentario.usuario.id,
      'Comentario promovido a Saber Ancestral',
      `Tu comentario en "${rec.titulo}" fue promovido a Saber Ancestral como "${titulo}".`,
      { type: 'comentario_promovido', recomendacionId: result.id },
    );
    this.logger.log(`Comentario #${comentarioId} promovido a saber ancestral #${result.id} por moderador #${moderadorId}`);

    return result;
  }

  async getInteracciones(recomendacionId: number) {
    const rec = await this.repo.findById(recomendacionId);
    if (!rec) {
      throw new NotFoundException(`Recomendación #${recomendacionId} no encontrada`);
    }

    return this.repo.getInteracciones(recomendacionId);
  }

  // ── Valoraciones ──

  async valorar(recomId: number, dto: CreateValoracionDto, usuarioId: number) {
    const rec = await this.repo.findById(recomId);
    if (!rec)
      throw new NotFoundException(`Recomendación #${recomId} no encontrada`);

    const result = await this.repo.upsertValoracion(
      recomId,
      usuarioId,
      dto.puntuacion,
    );

    const promedio = await this.repo.actualizarPromedio(recomId);

    const counts = await this.repo.getValoracionCounts(recomId);

    return {
      ...promedio,
      ...counts,
      miValoracion: result.accion === 'eliminada' ? null : dto.puntuacion,
    };
  }

  getValoraciones(recomendacionId: number) {
    return this.repo.getValoraciones(recomendacionId);
  }

  async getComentarios(recomendacionId: number) {
    const rec = await this.repo.findById(recomendacionId);
    if (!rec || !rec.activo) {
      throw new NotFoundException(
        `Recomendación #${recomendacionId} no encontrada`,
      );
    }

    return this.repo.getComentarios(recomendacionId);
  }

  async getMiValoracion(recomendacionId: number, usuarioId: number) {
    const val = await this.repo.findValoracionByUsuario(
      recomendacionId,
      usuarioId,
    );
    return { puntuacion: val?.puntuacion ?? null };
  }
}
