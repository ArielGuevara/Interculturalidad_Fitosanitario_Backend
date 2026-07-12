import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { ResetTokensRepository } from './reset-tokens.repository';
import { TwilioService } from '../notifications/twilio.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    private readonly usuariosRepo: UsuariosRepository,
    private readonly resetTokensRepo: ResetTokensRepository,
    private readonly twilioService: TwilioService,
  ) {}

  async requestReset(telefono: string) {
    const usuario = await this.usuariosRepo.findByTelefono(telefono);
    if (!usuario) {
      return { message: 'Si el teléfono está registrado, recibirás un código por WhatsApp' };
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.resetTokensRepo.create({
      usuarioId: usuario.id,
      codigo,
      telefono,
      expiresAt,
    });

    await this.twilioService.sendWhatsApp(telefono, codigo);

    return { message: 'Si el teléfono está registrado, recibirás un código por WhatsApp' };
  }

  async verifyCode(telefono: string, codigo: string) {
    const token = await this.resetTokensRepo.findValid(telefono, codigo);
    if (!token) {
      throw new BadRequestException('Código inválido o expirado');
    }
    return { message: 'Código válido' };
  }

  async resetPassword(telefono: string, codigo: string, newPassword: string) {
    const token = await this.resetTokensRepo.findValid(telefono, codigo);
    if (!token) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usuariosRepo.updatePassword(token.usuarioId, passwordHash);
    await this.resetTokensRepo.markAsUsed(token.id);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
