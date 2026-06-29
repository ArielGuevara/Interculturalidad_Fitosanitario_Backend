import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMonitor implements NestMiddleware {
  private readonly logger = new Logger('Performance');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (duration > 1000) {
        this.logger.warn(`SLOW ${method} ${originalUrl} ${statusCode} — ${duration}ms`);
      } else if (duration > 500) {
        this.logger.log(`${method} ${originalUrl} ${statusCode} — ${duration}ms`);
      }
    });

    next();
  }
}
