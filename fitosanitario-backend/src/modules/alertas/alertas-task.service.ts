import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertasService } from './alertas.service';

@Injectable()
export class AlertasTask {
  private readonly logger = new Logger(AlertasTask.name);

  constructor(private readonly alertasService: AlertasService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDeteccionAutomatica() {
    this.logger.log('Iniciando detección automática de brotes...');
    try {
      const resultado = await this.alertasService.ejecutarDeteccion();
      this.logger.log(
        `Detección automática completada: ${resultado.alertasCreadas} alertas creadas de ${resultado.totalBrotes} brotes detectados`,
      );
    } catch (err) {
      this.logger.error(
        'Error en detección automática',
        err instanceof Error ? err.message : err,
      );
    }
  }
}
