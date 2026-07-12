import { IsString } from 'class-validator';

export class RequestResetDto {
  @IsString()
  telefono = '';
}
