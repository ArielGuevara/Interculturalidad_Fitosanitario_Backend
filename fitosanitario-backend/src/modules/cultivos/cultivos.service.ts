import { Injectable, NotFoundException } from '@nestjs/common';
import { CultivosRepository } from './cultivos.repository';
import { CreateCultivoDto }   from './dto/create-cultivo.dto';
import { UpdateCultivoDto }   from './dto/update-cultivo.dto';

@Injectable()
export class CultivosService {
  constructor(private readonly cultivosRepo: CultivosRepository) {}

  findAll() {
    return this.cultivosRepo.findAll();
  }

  async findById(id: number) {
    const cultivo = await this.cultivosRepo.findById(id);
    if (!cultivo) throw new NotFoundException(`Cultivo #${id} no encontrado`);
    return cultivo;
  }

  create(dto: CreateCultivoDto) {
    return this.cultivosRepo.create(dto);
  }

  async update(id: number, dto: UpdateCultivoDto) {
    await this.findById(id); // valida que existe
    return this.cultivosRepo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id); // valida que existe
    return this.cultivosRepo.delete(id);
  }
}