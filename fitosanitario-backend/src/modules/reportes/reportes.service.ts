import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MultimediaService } from '../multimedia/multimedia.service';
import { ReportesRepository } from './reportes.repository';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { ReEditarReporteDto } from './dto/re-editar-reporte.dto';
import { NotificationEventService } from '../notifications/notification-event.service';
import * as schema from '../../db/schema';

@Injectable()
export class ReportesService {
  constructor(
    private readonly reportesRepository: ReportesRepository,
    private readonly multimediaService: MultimediaService,
    private readonly notificationEvent: NotificationEventService,
  ) {}

  async create(params: {
    dto: CreateReporteDto;
    usuarioId: number;
    images?: Express.Multer.File[];
    audio?: Express.Multer.File;
  }) {
    const images = params.images ?? [];
    if (images.length > 10) {
      throw new BadRequestException('Máximo 10 imágenes');
    }

    const imagenesUpload = images.length
      ? await this.multimediaService.uploadImages(images)
      : { urls: [] as string[] };

    const audioUpload = params.audio
      ? await this.multimediaService.uploadAudio(params.audio)
      : { url: null as string | null };

    const reporte = await this.reportesRepository.create({
      titulo: params.dto.titulo,
      descripcion: params.dto.descripcion,
      descripcionProblema: params.dto.descripcionProblema,
      usuarioId: params.usuarioId,
      cultivoId: params.dto.cultivoId,
      plagaId: params.dto.plagaId,
      imagenesUrls: imagenesUpload.urls,
      audioUrl: audioUpload.url,
      latitud: params.dto.latitud,
      longitud: params.dto.longitud,
      sincronizado: params.dto.sincronizado,
    });

    await this.notificationEvent.notifyRole(
      ['MODERADOR', 'ADMIN'],
      'Nuevo reporte',
      `Se ha creado un nuevo reporte: ${reporte.titulo}`,
      { type: 'nuevo_reporte', reporteId: reporte.id },
    );

    return reporte;
  }

  findAll(params?: { cultivoId?: number; q?: string; fechaInicio?: string; fechaFin?: string }) {
    if (params && (params.cultivoId || params.q || params.fechaInicio || params.fechaFin)) {
      return this.reportesRepository.findAllFiltered(params);
    }
    return this.reportesRepository.findAll();
  }

  findByUsuario(usuarioId: number) {
    return this.reportesRepository.findByUsuario(usuarioId);
  }

  findPendientes() {
    return this.reportesRepository.findPendientes();
  }

  async findById(id: number) {
    const reporte = await this.reportesRepository.findById(id);
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    return reporte;
  }

  async cambiarEstado(params: {
    reporteId: number;
    usuarioId: number;
    estadoNuevo: (typeof schema.estadoReporteEnum.enumValues)[number];
    motivo?: string;
  }) {
    const reporte = await this.findById(params.reporteId);

    const result = await this.reportesRepository.cambiarEstado({
      reporteId: params.reporteId,
      usuarioId: params.usuarioId,
      estadoAnterior: reporte.estado,
      estadoNuevo: params.estadoNuevo,
      motivo: params.motivo,
    });

    const estadoLabels: Record<string, string> = {
      VALIDADO: 'validado',
      RECHAZADO: 'rechazado',
      COMUNIDAD: 'enviado a la comunidad',
      VOLVER_A_REPORTAR: 'devuelto para corrección',
    };
    const label = estadoLabels[params.estadoNuevo] || params.estadoNuevo;
    await this.notificationEvent.notifyUser(
      reporte.usuarioId,
      'Reporte actualizado',
      `Tu reporte "${reporte.titulo}" fue ${label}${params.motivo ? `: ${params.motivo}` : ''}`,
      { type: 'cambio_estado', reporteId: reporte.id, estado: params.estadoNuevo },
    );

    return result;
  }

  async getHistorial(reporteId: number) {
    await this.findById(reporteId);
    return this.reportesRepository.getHistorial(reporteId);
  }

  async volverAReportar(params: {
    reporteId: number;
    usuarioId: number;
    motivo?: string;
    audio?: Express.Multer.File;
  }) {
    const reporte = await this.findById(params.reporteId);

    let audioRechazoUrl: string | null = null;
    if (params.audio) {
      const upload = await this.multimediaService.uploadAudio(params.audio);
      audioRechazoUrl = upload.url;
    }

    const motivoFinal = params.motivo ?? (audioRechazoUrl ? 'Escucha el audio para más detalles.' : '');

    await this.reportesRepository.setMotivoRechazo(
      params.reporteId,
      motivoFinal,
      audioRechazoUrl,
    );

    const result = await this.reportesRepository.cambiarEstado({
      reporteId: params.reporteId,
      usuarioId: params.usuarioId,
      estadoAnterior: reporte.estado,
      estadoNuevo: 'VOLVER_A_REPORTAR',
      motivo: motivoFinal,
    });

    await this.notificationEvent.notifyUser(
      reporte.usuarioId,
      'Reporte devuelto',
      `Tu reporte "${reporte.titulo}" necesita correcciones. Revisa el motivo.`,
      { type: 'cambio_estado', reporteId: reporte.id, estado: 'VOLVER_A_REPORTAR' },
    );

    return result;
  }

  async reEditar(params: {
    reporteId: number;
    usuarioId: number;
    dto: ReEditarReporteDto;
  }) {
    const reporte = await this.findById(params.reporteId);

    if (reporte.usuarioId !== params.usuarioId) {
      throw new ForbiddenException('No puedes editar un reporte de otro usuario');
    }
    if (reporte.estado !== 'VOLVER_A_REPORTAR') {
      throw new BadRequestException('Solo puedes re-editar reportes con estado "Volver a reportar"');
    }

    const updated = await this.reportesRepository.reEditar(params.reporteId, params.dto);

    const result = await this.reportesRepository.cambiarEstado({
      reporteId: params.reporteId,
      usuarioId: params.usuarioId,
      estadoAnterior: 'VOLVER_A_REPORTAR',
      estadoNuevo: 'PENDIENTE',
      motivo: 'Agricultor re-envió el reporte con correcciones',
    });

    await this.notificationEvent.notifyRole(
      ['MODERADOR', 'ADMIN'],
      'Reporte re-enviado',
      `El agricultor re-envió el reporte "${reporte.titulo}" con correcciones`,
      { type: 'nuevo_reporte', reporteId: reporte.id },
    );

    return result;
  }

  async suspenderUsuario(params: {
    usuarioId: number;
    reporteId: number;
    motivo: string;
    tipoDuracion: 'TIEMPO' | 'DIAS';
    duracion: number;
  }) {
    const reporte = await this.findById(params.reporteId);

    if (params.tipoDuracion === 'TIEMPO' && params.duracion < 10) {
      throw new BadRequestException('La duración en segundos debe ser al menos 10');
    }

    const now = new Date();
    let fechaFin: Date;

    if (params.tipoDuracion === 'TIEMPO') {
      fechaFin = new Date(now.getTime() + params.duracion * 1000);
    } else {
      fechaFin = new Date(now.getTime() + params.duracion * 24 * 60 * 60 * 1000);
    }

    const suspension = await this.reportesRepository.createSuspension({
      usuarioId: reporte.usuarioId,
      reporteId: params.reporteId,
      motivo: params.motivo,
      tipoDuracion: params.tipoDuracion,
      duracion: params.duracion,
      fechaFin,
    });

    await this.notificationEvent.notifyUser(
      reporte.usuarioId,
      'Cuenta suspendida',
      `Tu cuenta ha sido suspendida hasta ${fechaFin.toLocaleDateString()}. Motivo: ${params.motivo}`,
      { type: 'cuenta_suspendida', reporteId: reporte.id, suspensionId: suspension.id },
    );

    return suspension;
  }

  async getSuspensionActiva(usuarioId: number) {
    await this.reportesRepository.desactivarSuspensionesExpiradas();
    return this.reportesRepository.findSuspensionActiva(usuarioId);
  }

  async bulkSync(usuarioId: number, reportes: { localId: string; titulo: string; descripcion?: string; descripcionProblema?: string; cultivoId: number; plagaId?: number; latitud: number; longitud: number; imagenesUrls?: string[]; audioUrl?: string }[]) {
    const mapping: { localId: string; realId: number }[] = [];
    for (const r of reportes) {
      const created = await this.reportesRepository.create({
        titulo: r.titulo,
        descripcion: r.descripcion,
        descripcionProblema: r.descripcionProblema,
        usuarioId,
        cultivoId: r.cultivoId,
        plagaId: r.plagaId,
        imagenesUrls: r.imagenesUrls ?? [],
        audioUrl: r.audioUrl ?? null,
        latitud: r.latitud,
        longitud: r.longitud,
        sincronizado: true,
      });
      mapping.push({ localId: r.localId, realId: created.id });
    }
    return { sincronizados: mapping.length, mapping };
  }
}
