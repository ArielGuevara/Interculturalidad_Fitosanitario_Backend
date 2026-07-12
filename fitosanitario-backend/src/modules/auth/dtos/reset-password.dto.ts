import { IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  telefono = '';

  @IsString()
  @Length(6, 6)
  codigo = '';

  @IsString()
  @MinLength(8)
  newPassword = '';
}
