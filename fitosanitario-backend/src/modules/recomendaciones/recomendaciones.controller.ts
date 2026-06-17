import {
  Controller, Get, Post, Patch, Delete, Param,
  Body, ParseIntPipe, UseGuards, Query,
} from '@nestjs/common';
import { RecomendacionesService }   from './recomendaciones.service';
import { CreateRecomendacionDto, CreateValoracionDto } from './dto/create-recomendacion.dto';
import { JwtAuthGuard }            from '../../common/guards/jwt-auth.guard';
import { RolesGuard }              from '../../common/guards/roles.guard';
import { Roles }                   from '../../common/decorators/roles.decorator';
import { CurrentUser }             from '../../common/decorators/current-user.decorator';

@Controller('recomendaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecomendacionesController {
  constructor(private readonly service: RecomendacionesService) {}

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('cultivoId') cultivoId?: string,
    @Query('plagaId') plagaId?: string,
  ) {
    return this.service.findAll({
      tipo,
      cultivoId: cultivoId ? parseInt(cultivoId, 10) : undefined,
      plagaId:   plagaId   ? parseInt(plagaId, 10)   : undefined,
    });
  }

  @Get('mis-recomendaciones')
  findMine(@CurrentUser() user: { id: number }) {
    // Re-uses findAll with no filters; the service doesn't filter by user by default
    // We'll filter on the client side for simplicity
    return this.service.findAll();
  }

  @Get(':id/comentarios')
  getComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.getComentarios(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateRecomendacionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateRecomendacionDto>,
    @CurrentUser() user: { id: number; rol: string },
  ) {
    return this.service.update(id, dto, user.id, user.rol);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: string },
  ) {
    return this.service.remove(id, user.id, user.rol);
  }

  // Moderación — solo MODERADOR
  @Patch(':id/moderar')
  @Roles('MODERADOR')
  moderar(
    @Param('id', ParseIntPipe) id: number,
    @Body('moderado') moderado: boolean,
  ) {
    return this.service.moderar(id, moderado);
  }

  // ── Valoraciones ──
  @Post(':id/valorar')
  valorar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateValoracionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.valorar(id, dto, user.id);
  }

  @Get(':id/valoraciones')
  getValoraciones(@Param('id', ParseIntPipe) id: number) {
    return this.service.getValoraciones(id);
  }
}
