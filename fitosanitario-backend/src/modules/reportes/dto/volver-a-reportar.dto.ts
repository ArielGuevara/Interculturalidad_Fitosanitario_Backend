import { IsOptional, IsString, MinLength } from 'class-validator';

export class VolverAReportarDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  motivo?: string;
}
