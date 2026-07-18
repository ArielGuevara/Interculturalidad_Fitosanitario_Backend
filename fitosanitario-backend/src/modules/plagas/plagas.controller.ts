import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlagasService } from './plagas.service';
import { CreatePlagaDto } from './dto/create-plaga.dto';
import { UpdatePlagaDto } from './dto/update-plaga.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('plagas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlagasController {
  constructor(private readonly plagasService: PlagasService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('cultivoId', new ParseIntPipe({ optional: true })) cultivoId?: number,
  ) {
    return this.plagasService.findAll(search, cultivoId);
  }

  @Get('asociaciones')
  findAllAsociaciones() {
    return this.plagasService.findAllAsociaciones();
  }

  @Get(':id/cultivos')
  findCultivos(@Param('id', ParseIntPipe) id: number) {
    return this.plagasService.findCultivos(id);
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

  @Post(':id/cultivos')
  @Roles('MODERADOR')
  @HttpCode(HttpStatus.OK)
  setCultivos(
    @Param('id', ParseIntPipe) id: number,
    @Body('cultivoIds') cultivoIds: number[],
  ) {
    return this.plagasService.setCultivos(id, cultivoIds);
  }

  @Delete(':id')
  @Roles('MODERADOR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plagasService.remove(id);
  }
}
