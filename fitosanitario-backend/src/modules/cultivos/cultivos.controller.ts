import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { CultivosService } from './cultivos.service';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';
import { JwtAuthGuard }    from '../../common/guards/jwt-auth.guard';
import { RolesGuard }      from '../../common/guards/roles.guard';
import { Roles }           from '../../common/decorators/roles.decorator';

@Controller('cultivos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CultivosController {
  constructor(private readonly cultivosService: CultivosService) {}

  // Cualquier usuario autenticado puede leer
  @Get()
  findAll() {
    return this.cultivosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.findById(id);
  }

  // Solo MODERADOR puede crear, editar y eliminar
  @Post()
  @Roles('MODERADOR')
  create(@Body() dto: CreateCultivoDto) {
    return this.cultivosService.create(dto);
  }

  @Patch(':id')
  @Roles('MODERADOR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCultivoDto) {
    return this.cultivosService.update(id, dto);
  }

  @Delete(':id')
  @Roles('MODERADOR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.remove(id);
  }
}