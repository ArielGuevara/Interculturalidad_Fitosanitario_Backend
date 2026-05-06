import { Injectable, NotFoundException } from '@nestjs/common';
import { PlagasRepository } from './plagas.repository';
import { CreatePlagaDto }   from './dto/create-plaga.dto';
import { UpdatePlagaDto }   from './dto/update-plaga.dto';

@Injectable()
export class PlagasService {
  constructor(private readonly plagasRepo: PlagasRepository) {}

  findAll() {
    return this.plagasRepo.findAll();
  }

  async findById(id: number) {
    const plaga = await this.plagasRepo.findById(id);
    if (!plaga) throw new NotFoundException(`Plaga #${id} no encontrada`);
    return plaga;
  }

  create(dto: CreatePlagaDto) {
    return this.plagasRepo.create(dto);
  }

  async update(id: number, dto: UpdatePlagaDto) {
    await this.findById(id);
    return this.plagasRepo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.plagasRepo.delete(id);
  }
}