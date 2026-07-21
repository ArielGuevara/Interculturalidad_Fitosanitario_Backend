import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesRepository } from './notificaciones.repository';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(
    private readonly service: NotificacionesService,
    private readonly repo: NotificacionesRepository,
  ) {}

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.service.findByUser(user.id);
  }

  @Get('globales')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR')
  findGlobales() {
    return this.repo.findGlobales();
  }

  @Get('no-leidas')
  countNoLeidas(@CurrentUser() user: any) {
    return this.service.countNoLeidas(user.id);
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarLeida(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { titulo?: string; cuerpo?: string },
  ) {
    return this.repo.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.repo.delete(id);
  }
}
