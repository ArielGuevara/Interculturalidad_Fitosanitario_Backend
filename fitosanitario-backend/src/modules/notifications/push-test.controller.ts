import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PushService } from './push.service';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { NotificacionesRepository } from '../alertas/notificaciones.repository';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushTestController {
  constructor(
    private readonly pushService: PushService,
    private readonly dispositivosRepo: DispositivosRepository,
    private readonly notificacionesRepo: NotificacionesRepository,
  ) {}

  @Post('test')
  async testPush(@Req() req: any) {
    const dispositivos = await this.dispositivosRepo.findByUser(req.user.id);
    if (dispositivos.length === 0) {
      return { enviado: false, motivo: 'No hay dispositivos registrados para este usuario' };
    }
    const tokens = dispositivos.map((d) => d.token);
    await this.pushService.sendToTokens(
      tokens,
      '🔔 Notificación de prueba',
      'Si ves esto, las notificaciones funcionan correctamente.',
      { type: 'test', timestamp: new Date().toISOString() },
    );
    return { enviado: true, tokens: tokens.length, dispositivos: dispositivos.length };
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR')
  async broadcast(
    @Req() req: any,
    @Body() dto: { titulo: string; cuerpo: string; tipo: 'PELIGRO' | 'INFORMATIVO' },
  ) {
    const dispositivos = await this.dispositivosRepo.findAll();
    if (dispositivos.length === 0) {
      return { enviado: false, motivo: 'No hay dispositivos registrados' };
    }

    const tokens = dispositivos.map((d) => d.token);
    const uniqueTokens = [...new Set(tokens)];

    // Crear UNA sola notificación global (con el moderador como owner)
    await this.notificacionesRepo.create({
      usuarioId: req.user.id,
      titulo: dto.titulo,
      cuerpo: dto.cuerpo,
      esGlobal: true,
      tipo: dto.tipo,
    });

    const data: Record<string, any> = {
      type: dto.tipo === 'PELIGRO' ? 'alerta_peligro' : 'alerta_informativa',
      timestamp: new Date().toISOString(),
    };

    await this.pushService.sendToTokens(
      uniqueTokens,
      dto.titulo,
      dto.cuerpo,
      data,
    );

    return { enviado: true, tokens: uniqueTokens.length };
  }
}
