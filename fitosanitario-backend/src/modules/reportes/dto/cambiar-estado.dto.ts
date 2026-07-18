import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CambiarEstadoDto {
  @IsEnum(['PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO', 'VOLVER_A_REPORTAR'])
  estado: 'PENDIENTE' | 'COMUNIDAD' | 'VALIDADO' | 'RECHAZADO' | 'VOLVER_A_REPORTAR' = 'PENDIENTE';

  @IsString()
  @IsOptional()
  motivo?: string;
}
