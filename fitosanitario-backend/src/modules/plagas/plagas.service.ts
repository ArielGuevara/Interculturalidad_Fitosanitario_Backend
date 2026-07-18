import { Injectable, NotFoundException } from '@nestjs/common';
import { PlagasRepository } from './plagas.repository';
import { CreatePlagaDto } from './dto/create-plaga.dto';
import { UpdatePlagaDto } from './dto/update-plaga.dto';

@Injectable()
export class PlagasService {
  constructor(private readonly plagasRepo: PlagasRepository) {}

  findAll(search?: string, cultivoId?: number) {
    return this.plagasRepo.findAll(search, cultivoId);
  }

  findAllAsociaciones() {
    return this.plagasRepo.findAllAsociaciones();
  }

  async findCultivos(plagaId: number) {
    await this.findById(plagaId);
    return this.plagasRepo.findCultivosByPlaga(plagaId);
  }

  async findById(id: number) {
    const plaga = await this.plagasRepo.findById(id);
    if (!plaga) throw new NotFoundException(`Plaga #${id} no encontrada`);
    return plaga;
  }

  async create(dto: CreatePlagaDto) {
    const { cultivoIds, ...plagaData } = dto;
    const plaga = await this.plagasRepo.create(plagaData);
    if (cultivoIds && cultivoIds.length > 0) {
      await this.plagasRepo.setCultivos(plaga.id, cultivoIds);
    }
    return plaga;
  }

  async update(id: number, dto: UpdatePlagaDto) {
    await this.findById(id);
    const { cultivoIds, ...plagaData } = dto as any;
    const plaga = await this.plagasRepo.update(id, plagaData);
    if (cultivoIds && Array.isArray(cultivoIds)) {
      await this.plagasRepo.setCultivos(id, cultivoIds);
    }
    return plaga;
  }

  async setCultivos(id: number, cultivoIds: number[]) {
    await this.findById(id);
    return this.plagasRepo.setCultivos(id, cultivoIds);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.plagasRepo.delete(id);
  }
}
