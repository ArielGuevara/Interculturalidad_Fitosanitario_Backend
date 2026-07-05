import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RecomendacionesRepository } from './recomendaciones.repository';
import {
  CreateRecomendacionDto,
  CreateValoracionDto,
} from './dto/create-recomendacion.dto';

@Injectable()
export class RecomendacionesService {
  constructor(private readonly repo: RecomendacionesRepository) {}

  async create(dto: CreateRecomendacionDto, usuarioId: number) {
    return this.repo.create(dto, usuarioId);
  }

  findAll(filtros?: { tipo?: string; cultivoId?: number; plagaId?: number }) {
    return this.repo.findAll(filtros);
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
    dto: Partial<CreateRecomendacionDto>,
    usuarioId: number,
    userRol: string,
  ) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);

    const dueñoId = rec.usuario?.id;
    if (dueñoId !== usuarioId && userRol !== 'MODERADOR') {
      throw new ForbiddenException(
        'No tienes permiso para editar esta recomendación',
      );
    }

    return this.repo.update(id, dto);
  }

  async remove(id: number, usuarioId: number, userRol: string) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);

    const dueñoId = rec.usuario?.id;
    if (dueñoId !== usuarioId && userRol !== 'MODERADOR') {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta recomendación',
      );
    }

    return this.repo.softDelete(id);
  }

  async moderar(id: number, moderado: boolean) {
    const rec = await this.repo.findById(id);
    if (!rec) throw new NotFoundException(`Recomendación #${id} no encontrada`);
    return this.repo.moderar(id, moderado);
  }

  // ── Valoraciones ──

  async valorar(recomId: number, dto: CreateValoracionDto, usuarioId: number) {
    const rec = await this.repo.findById(recomId);
    if (!rec)
      throw new NotFoundException(`Recomendación #${recomId} no encontrada`);

    const existente = await this.repo.findValoracionByUsuario(
      recomId,
      usuarioId,
    );
    if (existente) {
      throw new BadRequestException('Ya has valorado esta recomendación');
    }

    await this.repo.crearValoracion(
      recomId,
      usuarioId,
      dto.puntuacion,
      dto.comentario,
    );

    return this.repo.actualizarPromedio(recomId);
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
}
