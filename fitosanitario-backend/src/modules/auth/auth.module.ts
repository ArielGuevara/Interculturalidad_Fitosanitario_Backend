import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ResetPasswordService } from './reset-password.service';
import { ResetPasswordController } from './reset-password.controller';
import { ResetTokensRepository } from './reset-tokens.repository';
import { JwtStrategy } from './jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioService } from '../notifications/twilio.service';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') ?? '',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') ??
            '7d') as any,
        },
      }),
    }),
  ],
  providers: [AuthService, ResetPasswordService, ResetTokensRepository, JwtStrategy, TwilioService],
  controllers: [AuthController, ResetPasswordController],
})
export class AuthModule {}
