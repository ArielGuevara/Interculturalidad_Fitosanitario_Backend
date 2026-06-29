import { apiClient } from '../infrastructure/http/apiClient';

jest.mock('../infrastructure/http/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const {
  getAlertas,
  getAlertaById,
  marcarAlertaLeida,
  getNotificaciones,
  marcarNotificacionLeida,
  countNotificacionesNoLeidas,
  registrarDispositivo,
  eliminarDispositivo,
} = require('../infrastructure/data/alertas/alertasApi');

describe('alertasApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlertas', () => {
    it('should fetch alertas', async () => {
      const mockData = [{ id: 1, titulo: 'Alerta 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAlertas();

      expect(apiClient.get).toHaveBeenCalledWith('/alertas');
      expect(result).toEqual(mockData);
    });
  });

  describe('getAlertaById', () => {
    it('should fetch alerta by id', async () => {
      const mockData = { id: 1, titulo: 'Alerta 1' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAlertaById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/alertas/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('marcarAlertaLeida', () => {
    it('should mark alerta as read', async () => {
      const mockData = { id: 1, leida: true };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marcarAlertaLeida(1);

      expect(apiClient.patch).toHaveBeenCalledWith('/alertas/1/leida');
      expect(result).toEqual(mockData);
    });
  });

  describe('getNotificaciones', () => {
    it('should fetch notificaciones by usuarioId', async () => {
      const mockData = [{ id: 1, titulo: 'Notif 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getNotificaciones(1);

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/1/notificaciones');
      expect(result).toEqual(mockData);
    });
  });

  describe('marcarNotificacionLeida', () => {
    it('should mark notification as read', async () => {
      const mockData = { id: 1, leida: true };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marcarNotificacionLeida(1);

      expect(apiClient.patch).toHaveBeenCalledWith('/notificaciones/1/leida');
      expect(result).toEqual(mockData);
    });
  });

  describe('countNotificacionesNoLeidas', () => {
    it('should count unread notifications', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: 3 });

      const result = await countNotificacionesNoLeidas(1);

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/1/notificaciones/no-leidas');
      expect(result).toBe(3);
    });
  });

  describe('registrarDispositivo', () => {
    it('should register device token', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await registrarDispositivo('token-123', 'android');

      expect(apiClient.post).toHaveBeenCalledWith('/dispositivos', {
        token: 'token-123',
        plataforma: 'android',
      });
    });
  });

  describe('eliminarDispositivo', () => {
    it('should unregister device token', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await eliminarDispositivo('token-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/dispositivos', {
        data: { token: 'token-123' },
      });
    });
  });
});
