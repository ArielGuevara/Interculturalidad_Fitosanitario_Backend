import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TratamientosRepository } from './tratamientos.repository';
import { ReportesService } from '../reportes/reportes.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    private readonly tratamientosRepo: TratamientosRepository,
    private readonly reportesService: ReportesService,
    private readonly notificationEvent: NotificationEventService,
  ) {}

  findAll(search?: string, cultivoId?: number) {
    return this.tratamientosRepo.findAll(search, cultivoId);
  }

  async findById(id: number) {
    const tratamiento = await this.tratamientosRepo.findById(id);
    if (!tratamiento) {
      throw new NotFoundException(`Tratamiento #${id} no encontrado`);
    }
    return tratamiento;
  }

  // Enciclopedia completa — para primera descarga offline
  findEnciclopedia() {
    return this.tratamientosRepo.findEnciclopedia();
  }

  // Enciclopedia incremental — solo lo nuevo desde fecha dada
  findEnciclopediaDesde(fechaDesde: Date) {
    return this.tratamientosRepo.findEnciclopediaDesde(fechaDesde);
  }

  async create(dto: CreateTratamientoDto, moderadorId: number) {
    // Valida que si viene reporteId, el reporte exista
    if (dto.reporteId) {
      const reporte = await this.reportesService.findById(dto.reporteId);

      // Si el reporte ya tiene tratamiento, no se puede crear otro
      const existing = await this.tratamientosRepo.findByReporte(dto.reporteId);
      if (existing) {
        throw new BadRequestException(
          `El reporte #${dto.reporteId} ya tiene un tratamiento oficial asignado`,
        );
      }

      const tratamiento = await this.tratamientosRepo.create(dto, moderadorId);

      await this.reportesService.cambiarEstado({
        reporteId: reporte.id,
        usuarioId: moderadorId,
        estadoNuevo: 'VALIDADO',
        motivo: 'Tratamiento oficial emitido',
      });

      await this.notificationEvent.notifyUser(
        reporte.usuarioId,
        'Tratamiento asignado',
        `Tu reporte "${reporte.titulo}" recibió un tratamiento oficial (moderador #${moderadorId}). Revisa los detalles.`,
        { type: 'tratamiento_asignado', reporteId: reporte.id, tratamientoId: tratamiento.id },
      );

      return tratamiento;
    }

    return this.tratamientosRepo.create(dto, moderadorId);
  }

  async update(id: number, dto: UpdateTratamientoDto) {
    await this.findById(id);
    return this.tratamientosRepo.update(id, dto);
  }

  async marcarEnciclopedia(id: number, enEnciclopedia: boolean) {
    await this.findById(id);
    return this.tratamientosRepo.marcarEnciclopedia(id, enEnciclopedia);
  }
}
