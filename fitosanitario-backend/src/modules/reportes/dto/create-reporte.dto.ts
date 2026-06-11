import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReporteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsOptional()
  descripcionProblema?: string;

  @Type(() => Number)
  @IsInt()
  cultivoId!: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  plagaId?: number;

  @Type(() => Number)
  @IsLatitude()
  latitud!: number;

  @Type(() => Number)
  @IsLongitude()
  longitud!: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  sincronizado?: boolean;
}
