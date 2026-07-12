import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.service.findByUser(user.id);
  }

  @Get('no-leidas')
  countNoLeidas(@CurrentUser() user: any) {
    return this.service.countNoLeidas(user.id);
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarLeida(id);
  }
}
