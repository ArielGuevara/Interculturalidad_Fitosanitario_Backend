import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateAlertaDto {
  @IsNumber()
  zonaId?: number;

  @IsNumber()
  parametroId?: number;

  @IsNumber()
  plagaId?: number;

  @IsNumber()
  cultivoId?: number;

  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsEnum(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'])
  nivel?: string = 'MEDIO';

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;

  @IsNumber()
  @Min(0)
  totalReportes?: number = 0;
}
