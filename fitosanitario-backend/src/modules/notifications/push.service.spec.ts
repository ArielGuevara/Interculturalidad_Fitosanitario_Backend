import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';

describe('PushService', () => {
  let service: PushService;
  let mockFetch: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(async () => {
    mockJson = jest.fn().mockResolvedValue({ data: 'ok' });
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    (global as any).fetch = mockFetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PushService],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPush', () => {
    it('should send push to Expo API', async () => {
      const messages = [
        { to: 'ExponentPushToken[xxx]', title: 'Test', body: 'Hello' },
      ];

      await service.sendPush(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        }),
      );
    });

    it('should handle empty token arrays gracefully', async () => {
      await service.sendPush([]);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('sendToTokens', () => {
    it('should map tokens and call sendPush', async () => {
      await service.sendToTokens(
        ['ExponentPushToken[aaa]', 'ExponentPushToken[bbb]'],
        'Alerta',
        'Cuerpo de la alerta',
        { tipo: 'alerta' },
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArg).toHaveLength(2);
      expect(callArg[0]).toEqual({
        to: 'ExponentPushToken[aaa]',
        title: 'Alerta',
        body: 'Cuerpo de la alerta',
        data: { tipo: 'alerta' },
      });
      expect(callArg[1]).toEqual({
        to: 'ExponentPushToken[bbb]',
        title: 'Alerta',
        body: 'Cuerpo de la alerta',
        data: { tipo: 'alerta' },
      });
    });
  });
});
