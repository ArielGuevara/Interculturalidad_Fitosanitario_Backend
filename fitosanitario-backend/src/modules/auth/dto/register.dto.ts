import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class RegisterDto {
  
    @IsString()
    nombre: string = '';

    @IsEmail()
    email: string = '';

    @IsString()
    password: string = '';

    @IsEnum(['AGRICULTOR', 'MODERADOR'])
    @IsOptional()
    rol?: 'AGRICULTOR' | 'MODERADOR';
}