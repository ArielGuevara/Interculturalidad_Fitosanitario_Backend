import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductosRepository } from './productos.repository';
import { CreateProductoDto }   from './dto/create-producto.dto';
import { UpdateProductoDto }   from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly productosRepo: ProductosRepository) {}

  findAll() {
    return this.productosRepo.findAll();
  }

  async findById(id: number) {
    const producto = await this.productosRepo.findById(id);
    if (!producto) throw new NotFoundException(`Producto #${id} no encontrado`);
    return producto;
  }

  create(dto: CreateProductoDto) {
    return this.productosRepo.create(dto);
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findById(id);
    return this.productosRepo.update(id, dto);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.productosRepo.delete(id);
  }
}