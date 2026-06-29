import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usuariosRepo: jest.Mocked<UsuariosRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUsuario = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    passwordHash: '$2b$10$hashedpassword',
    rol: 'AGRICULTOR' as const,
    fechaRegistro: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuariosRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuariosRepo = module.get(UsuariosRepository) as jest.Mocked<UsuariosRepository>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should validate user credentials and return JWT on successful login', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usuariosRepo.findByEmail.mockResolvedValue(mockUsuario);

      const dto: LoginDto = { email: 'juan@example.com', password: 'password123' };
      const result = await service.login(dto);

      expect(usuariosRepo.findByEmail).toHaveBeenCalledWith('juan@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUsuario.passwordHash);
      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.usuario).toEqual({
        id: 1,
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'AGRICULTOR',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'juan@example.com',
        rol: 'AGRICULTOR',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usuariosRepo.findByEmail.mockResolvedValue(null);

      const dto: LoginDto = { email: 'unknown@example.com', password: 'password123' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usuariosRepo.findByEmail.mockResolvedValue(mockUsuario);

      const dto: LoginDto = { email: 'juan@example.com', password: 'wrongpassword' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
