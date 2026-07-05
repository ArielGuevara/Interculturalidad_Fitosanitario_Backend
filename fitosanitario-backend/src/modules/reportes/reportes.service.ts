import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MultimediaService } from '../multimedia/multimedia.service';
import { ReportesRepository } from './reportes.repository';
import { CreateReporteDto } from './dto/create-reporte.dto';
import * as schema from '../../db/schema';

@Injectable()
export class ReportesService {
  constructor(
    private readonly reportesRepository: ReportesRepository,
    private readonly multimediaService: MultimediaService,
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

    return this.reportesRepository.create({
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

    return this.reportesRepository.cambiarEstado({
      reporteId: params.reporteId,
      usuarioId: params.usuarioId,
      estadoAnterior: reporte.estado,
      estadoNuevo: params.estadoNuevo,
      motivo: params.motivo,
    });
  }

  async getHistorial(reporteId: number) {
    await this.findById(reporteId); // valida que existe
    return this.reportesRepository.getHistorial(reporteId);
  }

  async bulkSync(usuarioId: number, reportes: any[]) {
    const results: any[] = [];
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
      results.push(created);
    }
    return { sincronizados: results.length, reportes: results };
  }
}
