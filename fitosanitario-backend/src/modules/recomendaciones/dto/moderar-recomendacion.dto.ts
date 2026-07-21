import { IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ModerarRecomendacionDto {
  @IsBoolean()
  moderado: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  duracionDias?: number;

  @IsString()
  @IsOptional()
  motivoRechazo?: string;
}
