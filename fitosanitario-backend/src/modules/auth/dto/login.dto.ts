import { IsString, IsEmail, MinLength } from 'class-validator';
export class LoginDto {
  @IsEmail()
  email = '';
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password = '';
}
