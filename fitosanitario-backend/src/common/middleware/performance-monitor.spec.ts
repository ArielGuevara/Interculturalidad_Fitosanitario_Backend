import { PerformanceMonitor } from './performance-monitor';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

describe('PerformanceMonitor', () => {
  let middleware: PerformanceMonitor;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let finishHandler: (() => void) | null;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    finishHandler = null;

    middleware = new PerformanceMonitor();

    mockReq = { method: 'GET', originalUrl: '/test' };

    mockRes = {
      on: jest.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishHandler = cb;
        }
      }),
      statusCode: 200,
    };

    mockNext = jest.fn();

    loggerWarnSpy = jest.spyOn(Logger.prototype as any, 'warn').mockImplementation();
    loggerLogSpy = jest.spyOn(Logger.prototype as any, 'log').mockImplementation();

    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call next()', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should measure request duration and log when >500ms', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    dateNowSpy.mockReturnValue(2000);
    finishHandler!();

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET /test 200'),
    );
  });

  it('should log slow requests (>1000ms) with SLOW prefix', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    dateNowSpy.mockReturnValue(3500);
    finishHandler!();

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('SLOW'),
    );
  });
});
