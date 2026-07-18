import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PushService } from './push.service';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushTestController {
  constructor(
    private readonly pushService: PushService,
    private readonly dispositivosRepo: DispositivosRepository,
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
}
