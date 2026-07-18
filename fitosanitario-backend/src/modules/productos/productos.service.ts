import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductosRepository } from './productos.repository';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly productosRepo: ProductosRepository) {}

  findAll(search?: string, cultivoId?: number, plagaId?: number) {
    return this.productosRepo.findAll(search, cultivoId, plagaId);
  }

  async findCultivos(productoId: number) {
    await this.findById(productoId);
    return this.productosRepo.findCultivosByProducto(productoId);
  }

  async findPlagasCultivos(productoId: number) {
    await this.findById(productoId);
    return this.productosRepo.findPlagasCultivos(productoId);
  }

  async setPlagasCultivos(productoId: number, pairs: { plagaId: number; cultivoId: number }[]) {
    await this.findById(productoId);
    return this.productosRepo.setPlagasCultivos(productoId, pairs);
  }

  async findAllAsociaciones() {
    return this.productosRepo.findAllAsociaciones();
  }

  async findById(id: number) {
    const producto = await this.productosRepo.findById(id);
    if (!producto) throw new NotFoundException(`Producto #${id} no encontrado`);
    return producto;
  }

  async create(dto: CreateProductoDto) {
    const { cultivoIds, pairs, ...productoData } = dto;
    const producto = await this.productosRepo.create(productoData);
    if (cultivoIds && cultivoIds.length > 0) {
      await this.productosRepo.setCultivos(producto.id, cultivoIds);
    }
    if (pairs && pairs.length > 0) {
      await this.productosRepo.setPlagasCultivos(producto.id, pairs);
    }
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findById(id);
    const { cultivoIds, pairs, ...productoData } = dto as any;
    const producto = await this.productosRepo.update(id, productoData);
    if (cultivoIds && Array.isArray(cultivoIds)) {
      await this.productosRepo.setCultivos(id, cultivoIds);
    }
    if (pairs && Array.isArray(pairs)) {
      await this.productosRepo.setPlagasCultivos(id, pairs);
    }
    return producto;
  }

  async setCultivos(id: number, cultivoIds: number[]) {
    await this.findById(id);
    return this.productosRepo.setCultivos(id, cultivoIds);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.productosRepo.delete(id);
  }
}
