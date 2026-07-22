import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health endpoint', () => {
    it('should keep the root endpoint available', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should report a healthy status', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
