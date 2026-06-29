import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateZonaAlertaDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  latitudCentro: number;

  @IsNumber()
  longitudCentro: number;

  @IsNumber()
  radioKm: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
