import { IsString, Length } from 'class-validator';

export class VerifyResetDto {
  @IsString()
  telefono = '';

  @IsString()
  @Length(6, 6)
  codigo = '';
}
