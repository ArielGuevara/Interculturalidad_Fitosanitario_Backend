import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ProductosService }   from './productos.service';
import { CreateProductoDto }  from './dto/create-producto.dto';
import { UpdateProductoDto }  from './dto/update-producto.dto';
import { JwtAuthGuard }       from '../../common/guards/jwt-auth.guard';
import { RolesGuard }         from '../../common/guards/roles.guard';
import { Roles }              from '../../common/decorators/roles.decorator';

@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findById(id);
  }

  @Post()
  @Roles('MODERADOR')
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Patch(':id')
  @Roles('MODERADOR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductoDto) {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  @Roles('MODERADOR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}