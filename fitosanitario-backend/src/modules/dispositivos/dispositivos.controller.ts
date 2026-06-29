import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DispositivosService } from './dispositivos.service';
import { RegistrarDispositivoDto } from './dto/registrar-dispositivo.dto';

@Controller('dispositivos')
@UseGuards(JwtAuthGuard)
export class DispositivosController {
  constructor(private service: DispositivosService) {}

  @Post()
  register(@Body() dto: RegistrarDispositivoDto, @Req() req: any) {
    return this.service.register(req.user.id, dto);
  }

  @Delete()
  unregister(@Body('token') token: string) {
    return this.service.unregister(token);
  }
}
