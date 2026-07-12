import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreComercial = '';

  @IsString()
  @IsOptional()
  @MaxLength(200)
  ingredienteActivo?: string;

  @IsEnum(['INSECTICIDA', 'FUNGICIDA', 'HERBICIDA', 'BIOLOGICO'])
  tipo: 'INSECTICIDA' | 'FUNGICIDA' | 'HERBICIDA' | 'BIOLOGICO' = 'INSECTICIDA';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unidadBase?: string;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  cultivoIds?: number[];
}
