import { IsString, IsEnum } from 'class-validator';

export class RegistrarDispositivoDto {
  @IsString()
  token: string;

  @IsEnum(['ios', 'android'])
  plataforma: string;
}
