import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';

export class BulkSyncReporteDto {
  @IsString()
  localId: string;

  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  descripcionProblema?: string;

  @IsNumber()
  cultivoId: number;

  @IsNumber()
  @IsOptional()
  plagaId?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud: number;

  @IsArray()
  @IsOptional()
  imagenesUrls?: string[];

  @IsString()
  @IsOptional()
  audioUrl?: string;
}

export class BulkSyncInputDto {
  @IsArray()
  reportes: BulkSyncReporteDto[];
}
