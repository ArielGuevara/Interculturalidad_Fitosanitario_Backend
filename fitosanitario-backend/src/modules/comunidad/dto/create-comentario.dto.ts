import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComentarioDto {
  @IsString()
  @IsOptional()
  contenido: string;

  // Si viene, es una respuesta a otro comentario
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  comentarioPadreId?: number;

  @IsString()
  @IsOptional()
  imagenUrl?: string;
}
