import { SetMetadata } from '@nestjs/common';

export const Permisos = (...permisos: string[]) => SetMetadata('permisos', permisos);
