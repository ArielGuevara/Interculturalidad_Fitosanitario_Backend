import { Injectable, Logger } from '@nestjs/common';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendPush(messages: PushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      const result = await res.json();

      if (!res.ok) {
        this.logger.error('Expo push API error', JSON.stringify(result));
      } else {
        this.logger.log(`Push enviados: ${messages.length}`);
      }
    } catch (err) {
      this.logger.error(
        'Error enviando push notifications',
        err instanceof Error ? err.message : err,
      );
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const messages: PushMessage[] = tokens.map((token) => ({
      to: token,
      title,
      body,
      data,
    }));

    await this.sendPush(messages);
  }
}
