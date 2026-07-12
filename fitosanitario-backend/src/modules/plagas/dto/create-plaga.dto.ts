import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreatePlagaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre = '';

  @IsEnum(['PLAGA', 'ENFERMEDAD', 'MALEZA'])
  tipo: 'PLAGA' | 'ENFERMEDAD' | 'MALEZA' = 'ENFERMEDAD';

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  imagenUrl?: string;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  cultivoIds?: number[];
}
