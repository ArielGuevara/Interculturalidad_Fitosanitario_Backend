import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nombre = '';

  @IsEmail()
  email = '';

  @IsString()
  password = '';

  @IsEnum(['AGRICULTOR', 'MODERADOR'])
  @IsOptional()
  rol?: 'AGRICULTOR' | 'MODERADOR';
}
