import {
  IsInt, IsNumber, IsString, IsOptional,
  IsNotEmpty, Min, ValidateIf, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecomendacionDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  reporteId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cultivoId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  plagaId?: number;

  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(['RECOMENDACION', 'CONSULTA', 'CONOCIMIENTO_ANCESTRAL'])
  @IsOptional()
  tipo?: 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL';

  // Regla: debe venir productoId O productoNombreLibre, no ninguno
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  productoId?: number;

  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.productoId)
  @IsNotEmpty({ message: 'Debes indicar un producto del catálogo o escribir el nombre del producto' })
  productoNombreLibre?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  dosis?: number;

  @IsString()
  @IsOptional()
  unidadDosis?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  intervaloDias?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  numeroAplicaciones?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  duracionTotalDias?: number;

  @IsString()
  @IsOptional()
  metodoAplicacion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
