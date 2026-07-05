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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AlertasService } from './alertas.service';
import { CreateZonaAlertaDto } from './dto/create-zona-alerta.dto';
import { UpdateZonaAlertaDto } from './dto/update-zona-alerta.dto';
import { CreateParametroAlertaDto } from './dto/create-parametro-alerta.dto';
import { UpdateParametroAlertaDto } from './dto/update-parametro-alerta.dto';
import { CreateAlertaDto } from './dto/create-alerta.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertasController {
  constructor(private service: AlertasService) {}

  // ── Zonas ──
  @Get('zonas-alerta')
  findAllZonas() {
    return this.service.findAllZonas();
  }

  @Get('zonas-alerta/:id')
  findZonaById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findZonaById(id);
  }

  @Post('zonas-alerta')
  @Roles('MODERADOR')
  createZona(@Body() dto: CreateZonaAlertaDto) {
    return this.service.createZona(dto);
  }

  @Patch('zonas-alerta/:id')
  @Roles('MODERADOR')
  updateZona(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZonaAlertaDto,
  ) {
    return this.service.updateZona(id, dto);
  }

  @Delete('zonas-alerta/:id')
  @Roles('MODERADOR')
  deleteZona(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteZona(id);
  }

  // ── Parámetros ──
  @Get('parametros-alerta')
  findAllParametros() {
    return this.service.findAllParametros();
  }

  @Get('parametros-alerta/:id')
  findParametroById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findParametroById(id);
  }

  @Post('parametros-alerta')
  @Roles('MODERADOR')
  createParametro(@Body() dto: CreateParametroAlertaDto) {
    return this.service.createParametro(dto);
  }

  @Patch('parametros-alerta/:id')
  @Roles('MODERADOR')
  updateParametro(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParametroAlertaDto,
  ) {
    return this.service.updateParametro(id, dto);
  }

  @Delete('parametros-alerta/:id')
  @Roles('MODERADOR')
  deleteParametro(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteParametro(id);
  }

  // ── Alertas ──
  @Get('alertas')
  findAll() {
    return this.service.findAll();
  }

  @Get('alertas/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post('alertas')
  @Roles('MODERADOR')
  create(@Body() dto: CreateAlertaDto) {
    return this.service.create(dto);
  }

  @Patch('alertas/:id/leida')
  marcarLeida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarLeida(id);
  }

  // ── Detección automática ──
  @Post('alertas/detectar')
  @Roles('MODERADOR')
  detectar() {
    return this.service.ejecutarDeteccion();
  }

  // ── Notificaciones ──
  @Get('notificaciones')
  findNotificaciones(@Req() req: any) {
    return this.service.findNotificacionesByUser(req.user.sub);
  }

  @Get('usuarios/:usuarioId/notificaciones')
  findNotificacionesByUser(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.service.findNotificacionesByUser(usuarioId);
  }

  @Patch('notificaciones/:id/leida')
  marcarNotificacionLeida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarNotificacionLeida(id);
  }

  @Get('usuarios/:usuarioId/notificaciones/no-leidas')
  countNoLeidas(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.service.countNotificacionesNoLeidas(usuarioId);
  }
}
