import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ResetPasswordService } from './reset-password.service';
import { RequestResetDto } from './dtos/request-reset.dto';
import { VerifyResetDto } from './dtos/verify-reset.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  requestReset(@Body() dto: RequestResetDto) {
    return this.resetPasswordService.requestReset(dto.telefono);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body() dto: VerifyResetDto) {
    return this.resetPasswordService.verifyCode(dto.telefono, dto.codigo);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordService.resetPassword(dto.telefono, dto.codigo, dto.nuevaPassword);
  }
}
