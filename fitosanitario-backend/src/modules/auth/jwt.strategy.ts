// src/modules/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usuariosRepo: UsuariosRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? '', 
    });
  }

  async validate(payload: { sub: number; email: string; rol: string }) {
    const usuario = await this.usuariosRepo.findById(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException();
    }
    return { id: usuario.id, email: usuario.email, rol: usuario.rol };
  }
}