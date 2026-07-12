import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: any;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('twilio.accountSid');
    const authToken = this.configService.get<string>('twilio.authToken');
    this.from = this.configService.get<string>('twilio.whatsappNumber') || 'whatsapp:+14155238886';
    this.enabled = !!(accountSid && authToken);

    if (this.enabled) {
      try {
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized');
      } catch {
        this.logger.warn('Failed to initialize Twilio client, falling back to console');
        this.enabled = false;
      }
    } else {
      this.logger.warn('Twilio not configured — codes will be logged to console');
    }
  }

  async sendWhatsApp(telefono: string, codigo: string): Promise<boolean> {
    const cleaned = telefono.startsWith('+')
      ? `+${telefono.replace(/[^0-9]/g, '')}`
      : telefono.replace(/[^0-9]/g, '');
    const to = `whatsapp:${cleaned}`;
    const body = `🔐 Tu código de recuperación Fitosanitario es: ${codigo}\nVálido por 15 minutos. No compartas este código con nadie.`;

    if (!this.enabled || !this.client) {
      this.logger.log(`[DEV] WhatsApp to ${to}: ${body}`);
      return true;
    }

    try {
      await this.client.messages.create({ from: this.from, to, body });
      this.logger.log(`WhatsApp sent to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp to ${to}`, error?.message);
      return false;
    }
  }
}
