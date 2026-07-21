import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class PromoverComentarioDto {
  @IsString()
  @IsOptional()
  comentarioModerador?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  plagaId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cultivoId?: number;
}
