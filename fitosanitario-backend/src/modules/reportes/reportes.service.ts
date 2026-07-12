import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MultimediaService } from '../multimedia/multimedia.service';
import { ReportesRepository } from './reportes.repository';
import { CreateReporteDto } from './dto/create-reporte.dto';
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

  findAll() {
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
    await this.findById(reporteId); // valida que existe
    return this.reportesRepository.getHistorial(reporteId);
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
