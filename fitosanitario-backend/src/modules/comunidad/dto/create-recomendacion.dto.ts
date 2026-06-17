import {
  IsInt, IsNumber, IsString, IsOptional,
  IsNotEmpty, Min, Max, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecomendacionDto {
  @IsInt()
  @Type(() => Number)
  reporteId: number;

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
  @Type(() => Number)
  dosis: number;

  @IsString()
  @IsNotEmpty()
  unidadDosis: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  intervaloDias: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  numeroAplicaciones: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duracionTotalDias: number;

  @IsString()
  @IsOptional()
  metodoAplicacion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}