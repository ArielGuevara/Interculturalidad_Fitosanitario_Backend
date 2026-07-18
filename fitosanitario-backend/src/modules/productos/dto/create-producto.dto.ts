import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlagaCultivoPair {
  @IsNumber()
  plagaId: number;

  @IsNumber()
  cultivoId: number;
}

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

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlagaCultivoPair)
  pairs?: PlagaCultivoPair[];
}
