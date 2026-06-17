import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ComunidadRepository }    from './comunidad.repository';
import { ReportesService }        from '../reportes/reportes.service';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateValoracionDto }    from './dto/create-valoracion.dto';
import { CreateComentarioDto }    from './dto/create-comentario.dto';

@Injectable()
export class ComunidadService {
  constructor(
    private readonly comunidadRepo:  ComunidadRepository,
    private readonly reportesService: ReportesService,
  ) {}

  // ── Recomendaciones ────────────────────────────────────────

  async createRecomendacion(dto: CreateRecomendacionDto, usuarioId: number) {
    // Valida que el reporte exista y no esté ya validado
    const reporte = await this.reportesService.findById(dto.reporteId!);
    if (reporte.estado === 'VALIDADO') {
      throw new BadRequestException(
        'Este reporte ya tiene un tratamiento oficial — no acepta más recomendaciones',
      );
    }
    if (reporte.estado === 'RECHAZADO') {
      throw new BadRequestException('No se pueden agregar recomendaciones a un reporte rechazado');
    }

    const recomendacion = await this.comunidadRepo.createRecomendacion(
      {
        ...dto,
        cultivoId: dto.cultivoId ?? reporte.cultivoId,
        plagaId: dto.plagaId ?? reporte.plagaId ?? undefined,
      },
      usuarioId,
    );

    // Si el reporte estaba PENDIENTE, pasa a COMUNIDAD automáticamente
    if (reporte.estado === 'PENDIENTE') {
      await this.reportesService.cambiarEstado({
        reporteId:   reporte.id,
        usuarioId,
        estadoNuevo: 'COMUNIDAD',
        motivo:      'Primera recomendación comunitaria recibida',
      });
    }

    return recomendacion;
  }

  async findRecomendacionesByReporte(reporteId: number) {
    await this.reportesService.findById(reporteId);
    const recomendaciones = await this.comunidadRepo.findRecomendacionesByReporte(reporteId);

    // Agrega el promedio de valoración a cada recomendación
    return Promise.all(
      recomendaciones.map(async (rec) => {
        const valoracion = await this.comunidadRepo.getPromedioValoracion(rec.id);
        return { ...rec, valoracion };
      }),
    );
  }

  async desactivarRecomendacion(id: number, moderadorId: number) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(id);
    if (!recomendacion) throw new NotFoundException(`Recomendación #${id} no encontrada`);
    return this.comunidadRepo.desactivarRecomendacion(id, moderadorId);
  }

  // ── Valoraciones ───────────────────────────────────────────

  async valorar(
    recomendacionId: number,
    usuarioId: number,
    dto: CreateValoracionDto,
  ) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(`Recomendación #${recomendacionId} no encontrada`);
    }

    // No puede valorar su propia recomendación
    if (recomendacion.usuarioId === usuarioId) {
      throw new BadRequestException('No puedes valorar tu propia recomendación');
    }

    const valoracion = await this.comunidadRepo.upsertValoracion(
      recomendacionId,
      usuarioId,
      dto.puntuacion,
    );

    const promedio = await this.comunidadRepo.actualizarPromedioValoracion(recomendacionId);
    return { valoracion, promedio };
  }

  // ── Comentarios ────────────────────────────────────────────

  async createComentario(
    recomendacionId: number,
    usuarioId: number,
    dto: CreateComentarioDto,
  ) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(`Recomendación #${recomendacionId} no encontrada`);
    }

    // Si es respuesta, valida que el comentario padre exista
    if (dto.comentarioPadreId) {
      const padre = await this.comunidadRepo.findComentarioById(dto.comentarioPadreId);
      if (!padre || !padre.activo) {
        throw new NotFoundException('El comentario al que intentas responder no existe');
      }
      // Evita anidar más de un nivel
      if (padre.comentarioPadreId) {
        throw new BadRequestException('Solo se permite un nivel de respuestas anidadas');
      }
    }

    return this.comunidadRepo.createComentario(recomendacionId, usuarioId, dto);
  }

  async findComentarios(recomendacionId: number) {
    const recomendacion = await this.comunidadRepo.findRecomendacionById(recomendacionId);
    if (!recomendacion || !recomendacion.activo) {
      throw new NotFoundException(`Recomendación #${recomendacionId} no encontrada`);
    }
    return this.comunidadRepo.findComentariosByRecomendacion(recomendacionId);
  }

  async desactivarComentario(id: number, moderadorId: number) {
    const comentario = await this.comunidadRepo.findComentarioById(id);
    if (!comentario) throw new NotFoundException(`Comentario #${id} no encontrado`);
    return this.comunidadRepo.desactivarComentario(id, moderadorId);
  }
}
