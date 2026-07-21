import { IsString, IsOptional, IsIn, IsNumberString } from 'class-validator';

export class GenerarInformeDto {
  @IsString()
  @IsIn(['cultivos', 'plagas', 'usuarios', 'productos', 'tratamientos'])
  tipo: string;

  @IsOptional()
  @IsNumberString()
  cultivoId?: string;

  @IsOptional()
  @IsString()
  rol?: string;

  @IsOptional()
  @IsString()
  tipoProducto?: string;
}
