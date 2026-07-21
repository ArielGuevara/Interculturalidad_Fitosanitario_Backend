import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.get<string[]>('permisos', context.getHandler());
    if (!permisosRequeridos || permisosRequeridos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (user.rol === 'ADMIN') return true;

    const userPermisos: string[] = user.permisos || [];
    const tienePermiso = permisosRequeridos.some(p => userPermisos.includes(p));
    if (!tienePermiso) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
