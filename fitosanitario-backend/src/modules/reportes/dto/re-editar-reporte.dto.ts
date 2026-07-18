import { IsString, IsOptional, IsInt, IsArray, MinLength } from 'class-validator';

export class ReEditarReporteDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  cultivoId?: number;

  @IsArray()
  @IsOptional()
  imagenesUrls?: string[];

  @IsString()
  @IsOptional()
  audioUrl?: string;
}
