import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductosRepository } from './productos.repository';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly productosRepo: ProductosRepository) {}

  findAll(search?: string, cultivoId?: number) {
    return this.productosRepo.findAll(search, cultivoId);
  }

  async findCultivos(productoId: number) {
    await this.findById(productoId);
    return this.productosRepo.findCultivosByProducto(productoId);
  }

  async findById(id: number) {
    const producto = await this.productosRepo.findById(id);
    if (!producto) throw new NotFoundException(`Producto #${id} no encontrado`);
    return producto;
  }

  async create(dto: CreateProductoDto) {
    const { cultivoIds, ...productoData } = dto;
    const producto = await this.productosRepo.create(productoData);
    if (cultivoIds && cultivoIds.length > 0) {
      await this.productosRepo.setCultivos(producto.id, cultivoIds);
    }
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findById(id);
    const { cultivoIds, ...productoData } = dto as any;
    const producto = await this.productosRepo.update(id, productoData);
    if (cultivoIds && Array.isArray(cultivoIds)) {
      await this.productosRepo.setCultivos(id, cultivoIds);
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
