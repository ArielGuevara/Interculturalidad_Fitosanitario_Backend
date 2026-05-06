import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreatePlagaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string = '';

  @IsEnum(['PLAGA', 'ENFERMEDAD', 'MALEZA'])
  tipo: 'PLAGA' | 'ENFERMEDAD' | 'MALEZA' = 'ENFERMEDAD';

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  imagenUrl?: string;
}