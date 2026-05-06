import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { PlagasService }   from './plagas.service';
import { CreatePlagaDto }  from './dto/create-plaga.dto';
import { UpdatePlagaDto }  from './dto/update-plaga.dto';
import { JwtAuthGuard }    from '../../common/guards/jwt-auth.guard';
import { RolesGuard }      from '../../common/guards/roles.guard';
import { Roles }           from '../../common/decorators/roles.decorator';

@Controller('plagas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlagasController {
  constructor(private readonly plagasService: PlagasService) {}

  @Get()
  findAll() {
    return this.plagasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plagasService.findById(id);
  }

  @Post()
  @Roles('MODERADOR')
  create(@Body() dto: CreatePlagaDto) {
    return this.plagasService.create(dto);
  }

  @Patch(':id')
  @Roles('MODERADOR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlagaDto) {
    return this.plagasService.update(id, dto);
  }

  @Delete(':id')
  @Roles('MODERADOR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plagasService.remove(id);
  }
}