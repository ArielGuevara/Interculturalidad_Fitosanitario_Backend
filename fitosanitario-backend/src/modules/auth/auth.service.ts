import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto }    from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepo: UsuariosRepository,
    private readonly jwtService:   JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existe = await this.usuariosRepo.findByEmail(dto.email);
    if (existe) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.usuariosRepo.create({
      nombre: dto.nombre,
      email:  dto.email,
      passwordHash,
      rol:    dto.rol ?? 'AGRICULTOR',
    });

    return this.buildResponse(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepo.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildResponse(usuario);
  }

  private buildResponse(usuario: any) {
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const token   = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol,
      },
    };
  }
}