import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCultivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string = '';

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imagenUrl?: string;
}