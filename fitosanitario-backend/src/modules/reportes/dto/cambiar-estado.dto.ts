import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CambiarEstadoDto {
  @IsEnum(['PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO'])
  estado: 'PENDIENTE' | 'COMUNIDAD' | 'VALIDADO' | 'RECHAZADO' = 'PENDIENTE';

  @IsString()
  @IsOptional()
  motivo?: string;
}
