import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ComunidadRepository } from './comunidad.repository';
import { ReportesService } from '../reportes/reportes.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateValoracionDto } from './dto/create-valoracion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';

@Injectable()
export class ComunidadService {
  constructor(
    private readonly comunidadRepo: ComunidadRepository,
    private readonly reportesService: ReportesService,
    private readonly notificationEvent: NotificationEventService,
  ) {}

  // ── Recomendaciones ────────────────────────────────────────

  async createRecomendacion(dto: CreateRecomendacionDto, usuarioId: number) {
    const reporte = await this.reportesService.findById(dto.reporteId!);
    if (reporte.estado === 'VALIDADO') {
      throw new BadRequestException(
        'Este reporte ya tiene un tratamiento oficial — no acepta más recomendaciones',
      );
    }
    if (reporte.estado === 'RECHAZADO') {
      throw new BadRequestException(
        'No se pueden agregar recomendaciones a un reporte rechazado',
      );
    }

    const recomendacion = await this.comunidadRepo.createRecomendacion(
      {
        ...dto,
        cultivoId: dto.cultivoId ?? reporte.cultivoId,
        plagaId: dto.plagaId ?? reporte.plagaId ?? undefined,
      },
      usuarioId,
    );

    if (reporte.estado === 'PENDIENTE') {
      await this.reportesService.cambiarEstado({
        reporteId: reporte.id,
        usuarioId,
        estadoNuevo: 'COMUNIDAD',
        motivo: 'Primera recomendación comunitaria recibida',
      });
    }

    await this.notificationEvent.notifyUser(
      reporte.usuarioId,
      'Nueva recomendación',
      `Tu reporte "${reporte.titulo}" recibió una recomendación en el foro`,
      { type: 'nuevo_comentario', recomendacionId: recomendacion.id, reporteId: reporte.id },
    );

    await this.notificationEvent.notifyRole(
      ['MODERADOR', 'ADMIN'],
      'Nueva recomendación en foro',
      `Se agregó una recomendación al reporte "${reporte.titulo}"`,
      { type: 'nuevo_comentario', recomendacionId: recomendacion.id, reporteId: reporte.id },
    );

    return recomendacion;
  }

  async findRecomendacionesByReporte(reporteId: number) {
    await this.reportesService.findById(reporteId);
    const recomendaciones =
      await this.comunidadRepo.findRecomendacionesByReporte(reporteId);

    // Agrega el promedio de valoración a cada recomendación
    return Promise.all(
      recomendaciones.map(async (rec) => {
        const valoracion = await this.comunidadRepo.getPromedioValoracion(
          rec.id,
        );
        return { ...rec, valoracion };
      }),
    );
  }

  async desactivarRecomendacion(id: number, moderadorId: number) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(id);
    if (!recomendacion)
      throw new NotFoundException(`Recomendación #${id} no encontrada`);
    return this.comunidadRepo.desactivarRecomendacion(id, moderadorId);
  }

  async toggleRecomendacion(id: number, _usuarioId: number) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(id);
    if (!recomendacion)
      throw new NotFoundException(`Recomendación #${id} no encontrada`);
    return this.comunidadRepo.toggleRecomendacionActiva(id);
  }

  // ── Valoraciones ───────────────────────────────────────────

  async valorar(
    recomendacionId: number,
    usuarioId: number,
    dto: CreateValoracionDto,
  ) {
    const recomendacion =
      await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(
        `Recomendación #${recomendacionId} no encontrada`,
      );
    }

    // No puede valorar su propia recomendación
    if (recomendacion.usuarioId === usuarioId) {
      throw new BadRequestException(
        'No puedes valorar tu propia recomendación',
      );
    }

    const valoracion = await this.comunidadRepo.upsertValoracion(
      recomendacionId,
      usuarioId,
      dto.puntuacion,
    );

    const promedio =
      await this.comunidadRepo.actualizarPromedioValoracion(recomendacionId);
    return { valoracion, promedio };
  }

  // ── Comentarios ────────────────────────────────────────────

  async createComentario(
    recomendacionId: number,
    usuarioId: number,
    dto: CreateComentarioDto & { audioUrl?: string | null; imagenUrl?: string | null },
  ) {
    const recomendacion =
      await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(
        `Recomendación #${recomendacionId} no encontrada`,
      );
    }

    if (dto.comentarioPadreId) {
      const padre = await this.comunidadRepo.findComentarioById(
        dto.comentarioPadreId,
      );
      if (!padre || !padre.activo) {
        throw new NotFoundException(
          'El comentario al que intentas responder no existe',
        );
      }
    }

    const comentario = await this.comunidadRepo.createComentario(recomendacionId, usuarioId, dto);

    if (recomendacion.usuarioId !== usuarioId) {
      await this.notificationEvent.notifyUser(
        recomendacion.usuarioId,
        'Nuevo comentario',
        `Alguien comentó en tu recomendación "${recomendacion.titulo}"`,
        { type: 'nuevo_comentario', recomendacionId, comentarioId: comentario.id },
      );
    }

    return comentario;
  }

  async findComentarios(recomendacionId: number) {
    const recomendacion =
      await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(
        `Recomendación #${recomendacionId} no encontrada`,
      );
    }
    return this.comunidadRepo.findComentariosByRecomendacion(recomendacionId);
  }

  async desactivarComentario(id: number, usuarioId: number, userRol: string) {
    const comentario = await this.comunidadRepo.findComentarioById(id);
    if (!comentario)
      throw new NotFoundException(`Comentario #${id} no encontrado`);
    if (comentario.usuarioId !== usuarioId && userRol !== 'MODERADOR' && userRol !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para eliminar este comentario');
    }
    return this.comunidadRepo.desactivarComentario(id, usuarioId);
  }
}
