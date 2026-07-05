import { Test, TestingModule } from '@nestjs/testing';
import { DispositivosService } from './dispositivos.service';
import { DispositivosRepository } from './dispositivos.repository';

describe('DispositivosService', () => {
  let service: DispositivosService;
  let repo: jest.Mocked<DispositivosRepository>;

  const mockDispositivo = {
    id: 1,
    usuarioId: 1,
    token: 'expo-token-123',
    plataforma: 'android',
    activo: true,
    ultimoUso: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispositivosService,
        {
          provide: DispositivosRepository,
          useValue: {
            findAll: jest.fn(),
            findByUser: jest.fn(),
            register: jest.fn(),
            unregister: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DispositivosService>(DispositivosService);
    repo = module.get(DispositivosRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new device', async () => {
      repo.register.mockResolvedValue(mockDispositivo);

      const result = await service.register(1, {
        token: 'expo-token-123',
        plataforma: 'android',
      });

      expect(repo.register).toHaveBeenCalledWith(1, {
        token: 'expo-token-123',
        plataforma: 'android',
      });
      expect(result).toEqual(mockDispositivo);
    });
  });

  describe('findByUser', () => {
    it('should find devices by user', async () => {
      repo.findByUser.mockResolvedValue([mockDispositivo]);

      const result = await service.findByUser(1);

      expect(repo.findByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockDispositivo]);
    });
  });

  describe('unregister', () => {
    it('should unregister a device by token', async () => {
      repo.unregister.mockResolvedValue(undefined);

      await service.unregister('expo-token-123');

      expect(repo.unregister).toHaveBeenCalledWith('expo-token-123');
    });
  });
});
