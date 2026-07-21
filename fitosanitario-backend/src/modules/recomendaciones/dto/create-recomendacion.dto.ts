import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  Max,
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
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsEnum(['RECOMENDACION', 'CONSULTA', 'CONOCIMIENTO_ANCESTRAL'])
  tipo: 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL' =
    'RECOMENDACION';

  @IsString()
  @IsOptional()
  solucion?: string;

  @IsString()
  @IsOptional()
  comentarioModerador?: string;

  @IsString()
  @IsOptional()
  imagenUrl?: string;

  @IsOptional()
  moderado?: boolean;

  @IsString()
  @IsOptional()
  motivoRechazo?: string;
}

export class CreateValoracionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  puntuacion: number;

  @IsString()
  @IsOptional()
  comentario?: string;
}
