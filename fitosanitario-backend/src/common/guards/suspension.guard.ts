import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ReportesService } from '../../modules/reportes/reportes.service';

@Injectable()
export class SuspensionGuard implements CanActivate {
  constructor(private reportesService: ReportesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) return true;

    const suspension = await this.reportesService.getSuspensionActiva(user.id);
    if (suspension) {
      throw new ForbiddenException(
        `Tu cuenta está suspendida hasta el ${new Date(suspension.fechaFin).toLocaleDateString()}. Motivo: ${suspension.motivo}`,
      );
    }
    return true;
  }
}
