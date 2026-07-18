import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: any = null;

  constructor(private readonly configService: ConfigService) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const path = this.configService.get<string>('firebase.serviceAccountPath');
      if (path) {
        const admin = require('firebase-admin');
        if (admin.getApps().length === 0) {
          const resolvedPath = require('path').resolve(process.cwd(), path);
          const serviceAccount = require(resolvedPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.logger.log('Firebase Admin initialized for FCM v1');
        }
        this.firebaseApp = admin.getApp();
      } else {
        this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set — falling back to Expo Push API');
      }
    } catch (err: any) {
      this.logger.warn('Firebase init failed, falling back to Expo Push API:', err?.message ?? err);
    }
  }

  private sendViaExpo(messages: PushMessage[]): Promise<void> {
    return this.sendPush(messages);
  }

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
        this.logger.log(`Expo push enviados: ${messages.length}`);
      }
    } catch (err) {
      this.logger.error('Error enviando push notifications', err instanceof Error ? err.message : err);
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (tokens.length === 0) return;

    if (this.firebaseApp) {
      try {
        const { getMessaging } = require('firebase-admin/messaging');
        const fcmData: Record<string, string> = {};
        if (data) {
          for (const [key, value] of Object.entries(data)) {
            fcmData[key] = String(value ?? '');
          }
        }

        const response = await getMessaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: fcmData,
        });

        this.logger.log(
          `FCM v1 enviados: ${response.successCount} OK, ${response.failureCount} fallaron`,
        );
        return;
      } catch (err: any) {
        this.logger.error('FCM v1 error, falling back to Expo:', err?.message ?? err);
      }
    }

    const expoTokens = tokens.filter((t) => t.startsWith('ExponentPushToken'));
    if (expoTokens.length > 0) {
      const messages: PushMessage[] = expoTokens.map((token) => ({
        to: token,
        title,
        body,
        data,
      }));
      await this.sendViaExpo(messages);
    }
  }
}
