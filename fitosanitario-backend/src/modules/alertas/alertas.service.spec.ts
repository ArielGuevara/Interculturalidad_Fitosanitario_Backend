import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { AlertasRepository } from './alertas.repository';
import { ZonasRepository } from './zonas.repository';
import { ParametrosAlertaRepository } from './parametros-alerta.repository';
import { NotificacionesRepository } from './notificaciones.repository';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { PushService } from '../notifications/push.service';

describe('AlertasService', () => {
  let service: AlertasService;
  let zonasRepo: jest.Mocked<ZonasRepository>;
  let parametrosRepo: jest.Mocked<ParametrosAlertaRepository>;
  let alertasRepo: jest.Mocked<AlertasRepository>;
  let dispositivosRepo: jest.Mocked<DispositivosRepository>;
  let pushService: jest.Mocked<PushService>;

  const mockZona = {
    id: 1,
    nombre: 'Zona test',
    descripcion: 'Descripción',
    latitudCentro: -1.23,
    longitudCentro: -78.45,
    radioKm: 10,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParametro = {
    id: 1,
    nombre: 'Parametro test',
    plagaId: 1,
    cultivoId: 1,
    umbralReportes: 3,
    radioKm: 10,
    ventanaHoras: 72,
    activo: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertasService,
        {
          provide: AlertasRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            marcarLeida: jest.fn(),
            detectarBrotes: jest.fn(),
          },
        },
        {
          provide: ZonasRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ParametrosAlertaRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: NotificacionesRepository,
          useValue: {
            findByUser: jest.fn(),
            create: jest.fn(),
            marcarLeida: jest.fn(),
            countNoLeidas: jest.fn(),
          },
        },
        {
          provide: DispositivosRepository,
          useValue: {
            findAll: jest.fn(),
            findByUser: jest.fn(),
            register: jest.fn(),
            unregister: jest.fn(),
          },
        },
        {
          provide: PushService,
          useValue: {
            sendToTokens: jest.fn(),
            sendPush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertasService>(AlertasService);
    alertasRepo = module.get(AlertasRepository);
    zonasRepo = module.get(ZonasRepository);
    parametrosRepo = module.get(ParametrosAlertaRepository);
    dispositivosRepo = module.get(DispositivosRepository);
    pushService = module.get(PushService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllZonas', () => {
    it('should find all zonas', async () => {
      zonasRepo.findAll.mockResolvedValue([mockZona]);

      const result = await service.findAllZonas();

      expect(zonasRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockZona]);
    });
  });

  describe('findZonaById', () => {
    it('should throw NotFoundException for non-existent zona', async () => {
      zonasRepo.findById.mockResolvedValue(null);

      await expect(service.findZonaById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return zona when found', async () => {
      zonasRepo.findById.mockResolvedValue(mockZona);

      const result = await service.findZonaById(1);

      expect(result).toEqual(mockZona);
    });
  });

  describe('createParametro', () => {
    it('should create a parametro', async () => {
      const data = {
        nombre: 'Nuevo parámetro',
        plagaId: 1,
        cultivoId: 1,
        umbralReportes: 5,
        radioKm: 15,
        ventanaHoras: 48,
      };

      parametrosRepo.create.mockResolvedValue({
        ...mockParametro,
        ...data,
      });

      const result = await service.createParametro(data);

      expect(parametrosRepo.create).toHaveBeenCalledWith(data);
      expect(result.nombre).toBe('Nuevo parámetro');
    });
  });
});
