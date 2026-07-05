import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ComunidadService } from './comunidad.service';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateValoracionDto } from './dto/create-valoracion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComunidadController {
  constructor(private readonly comunidadService: ComunidadService) {}

  // ── Recomendaciones ────────────────────────────────────────

  // GET /reportes/:reporteId/recomendaciones
  @Get('reportes/:reporteId/recomendaciones')
  findRecomendaciones(@Param('reporteId', ParseIntPipe) reporteId: number) {
    return this.comunidadService.findRecomendacionesByReporte(reporteId);
  }

  // POST /reportes/:reporteId/recomendaciones
  @Post('reportes/:reporteId/recomendaciones')
  createRecomendacion(
    @Param('reporteId', ParseIntPipe) reporteId: number,
    @Body() dto: CreateRecomendacionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.createRecomendacion(
      { ...dto, reporteId },
      user.id,
    );
  }

  // DELETE /recomendaciones/:id — eliminación lógica, solo MODERADOR
  @Delete('recomendaciones/:id')
  @Roles('MODERADOR')
  desactivarRecomendacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.desactivarRecomendacion(id, user.id);
  }

  // ── Valoraciones ───────────────────────────────────────────

  // POST /recomendaciones/:id/valorar
  @Post('recomendaciones/:id/valorar')
  valorar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateValoracionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.valorar(id, user.id, dto);
  }

  // ── Comentarios ────────────────────────────────────────────

  // GET /recomendaciones/:id/comentarios
  @Get('recomendaciones/:id/comentarios')
  findComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.comunidadService.findComentarios(id);
  }

  // POST /recomendaciones/:id/comentarios
  @Post('recomendaciones/:id/comentarios')
  createComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComentarioDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.createComentario(id, user.id, dto);
  }

  // DELETE /comentarios/:id — eliminación lógica, solo MODERADOR
  @Delete('comentarios/:id')
  @Roles('MODERADOR')
  desactivarComentario(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.desactivarComentario(id, user.id);
  }
}
