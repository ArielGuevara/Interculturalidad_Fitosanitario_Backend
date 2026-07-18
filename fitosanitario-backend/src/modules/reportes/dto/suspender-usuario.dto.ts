import { IsString, IsEnum, IsInt, Min, MinLength } from 'class-validator';

export class SuspenderUsuarioDto {
  @IsString()
  @MinLength(10)
  motivo: string;

  @IsEnum(['TIEMPO', 'DIAS'])
  tipoDuracion: 'TIEMPO' | 'DIAS';

  @IsInt()
  @Min(1)
  duracion: number;
}
