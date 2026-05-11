import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MultimediaService } from '../multimedia/multimedia.service';
import { ReportesRepository } from './reportes.repository';
import { CreateReporteDto } from './dto/create-reporte.dto';

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
      usuarioId: params.usuarioId,
      cultivoId: params.dto.cultivoId,
      imagenesUrls: imagenesUpload.urls,
      audioUrl: audioUpload.url,
      latitud: params.dto.latitud,
      longitud: params.dto.longitud,
    });
  }

  findAll() {
    return this.reportesRepository.findAll();
  }

  async findById(id: number) {
    const reporte = await this.reportesRepository.findById(id);
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    return reporte;
  }
}
