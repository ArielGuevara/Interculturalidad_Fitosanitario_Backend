import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepo: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.rol == 'MODERADOR') {
      throw new ForbiddenException('No puedes registrarte como MODERADOR');
    }

    const existe = await this.usuariosRepo.findByEmail(dto.email);
    if (existe) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.usuariosRepo.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      passwordHash,
      rol: dto.rol ?? 'AGRICULTOR',
    });

    return this.buildResponse(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepo.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('Cuenta inactiva');
    }

    const passwordValido = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildResponse(usuario);
  }

  private buildResponse(usuario: any) {
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol, permisos: usuario.permisos ?? [] };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono ?? null,
        rol: usuario.rol,
        cargo: usuario.cargo ?? null,
        activo: usuario.activo ?? true,
        permisos: usuario.permisos ?? [],
        fechaRegistro: usuario.fechaRegistro,
      },
    };
  }
}
