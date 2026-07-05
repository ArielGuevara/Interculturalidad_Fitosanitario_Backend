import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateParametroAlertaDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @IsOptional()
  plagaId?: number;

  @IsNumber()
  @IsOptional()
  cultivoId?: number;

  @IsNumber()
  @Min(1)
  umbralReportes?: number = 3;

  @IsNumber()
  @Min(1)
  radioKm?: number = 10;

  @IsNumber()
  @Min(1)
  ventanaHoras?: number = 72;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
