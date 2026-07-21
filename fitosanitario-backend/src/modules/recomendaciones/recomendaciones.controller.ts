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
  Logger,
} from '@nestjs/common';
import { RecomendacionesService } from './recomendaciones.service';
import {
  CreateRecomendacionDto,
  CreateValoracionDto,
} from './dto/create-recomendacion.dto';
import { ModerarRecomendacionDto } from './dto/moderar-recomendacion.dto';
import { PromoverComentarioDto } from './dto/promover-comentario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuspensionGuard } from '../../common/guards/suspension.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('recomendaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecomendacionesController {
  private readonly logger = new Logger(RecomendacionesController.name);

  constructor(private readonly service: RecomendacionesService) {}

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('cultivoId') cultivoId?: string,
    @Query('plagaId') plagaId?: string,
    @Query('moderado') moderado?: string,
  ) {
    return this.service.findAll({
      tipo,
      cultivoId: cultivoId ? parseInt(cultivoId, 10) : undefined,
      plagaId: plagaId ? parseInt(plagaId, 10) : undefined,
      moderado: moderado !== undefined ? moderado === 'true' : undefined,
    });
  }

  @Get('saberes-ancestrales')
  findAllSaberes(
    @Query('q') q?: string,
    @Query('estado') estado?: string,
    @Query('cultivoId') cultivoId?: string,
    @Query('plagaId') plagaId?: string,
    @CurrentUser() user?: { id: number },
  ) {
    return this.service.findAllSaberes({
      q,
      estado,
      cultivoId: cultivoId ? parseInt(cultivoId, 10) : undefined,
      plagaId: plagaId ? parseInt(plagaId, 10) : undefined,
    }, user?.id);
  }

  @Get('mis-recomendaciones')
  findMine(@CurrentUser() user: { id: number }) {
    return this.service.findByUsuario(user.id);
  }

  @Get(':id/comentarios')
  getComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.getComentarios(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Get(':id/interacciones')
  getInteracciones(@Param('id', ParseIntPipe) id: number) {
    return this.service.getInteracciones(id);
  }

  @Post()
  @UseGuards(SuspensionGuard)
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

  @Delete(':id/fisica')
  @Roles('MODERADOR')
  removeFisicamente(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.hardRemove(id, user.id);
  }

  // Moderación — solo MODERADOR
  @Patch(':id/moderar')
  @Roles('MODERADOR')
  moderar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerarRecomendacionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.moderar(id, dto, user.id);
  }

  // Promover comentario a Saber Ancestral
  @Post(':id/promover-comentario/:comentarioId')
  @Roles('MODERADOR')
  promoverComentario(
    @Param('id', ParseIntPipe) id: number,
    @Param('comentarioId', ParseIntPipe) comentarioId: number,
    @Body() dto: PromoverComentarioDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.promoteComment(id, comentarioId, dto, user.id);
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

  @Get(':id/mi-valoracion')
  getMiValoracion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.getMiValoracion(id, user.id);
  }

  @Get(':id/valoraciones')
  getValoraciones(@Param('id', ParseIntPipe) id: number) {
    return this.service.getValoraciones(id);
  }
}
