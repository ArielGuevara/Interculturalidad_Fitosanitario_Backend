import {
  IsInt,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTratamientoDto {
  // Origen — al menos uno de los dos debe venir
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  reporteId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  recomendacionOrigenId?: number;

  // Qué se trata y con qué
  @IsInt()
  @Type(() => Number)
  cultivoId: number;

  @IsInt()
  @Type(() => Number)
  plagaId: number;

  @IsInt()
  @Type(() => Number)
  productoId: number;

  // Dosificación
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  dosis: number;

  @IsString()
  @IsNotEmpty()
  unidadDosis: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  volumenAgua?: number;

  @IsString()
  @IsOptional()
  unidadVolumen?: string;

  @IsEnum(['FOLIAR', 'SUELO', 'RIEGO'])
  metodoAplicacion: 'FOLIAR' | 'SUELO' | 'RIEGO' = 'FOLIAR';

  // Calendario de aplicación
  @IsInt()
  @Min(1)
  @Type(() => Number)
  intervaloDias: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  numeroAplicaciones: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duracionTotalDias: number = 1;

  // Seguridad
  @IsInt()
  @Min(0)
  @Type(() => Number)
  diasCarencia: number = 0;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  periodoReingresoHoras?: number;

  // Contexto adicional
  @IsString()
  @IsOptional()
  etapaCultivo?: string;

  @IsString()
  @IsOptional()
  condicionesAplicacion?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enEnciclopedia?: boolean;
}
