import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
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
      const jsonEnv = this.configService.get<string>('firebase.serviceAccountJson');
      let serviceAccount: any = null;

      if (jsonEnv) {
        serviceAccount = JSON.parse(jsonEnv);
        this.logger.log('Firebase service account loaded from env var');
      } else if (path) {
        const resolvedPath = require('path').resolve(process.cwd(), path);
        serviceAccount = require(resolvedPath);
        this.logger.log('Firebase service account loaded from file');
      }

      if (serviceAccount) {
        const admin = require('firebase-admin');
        if (admin.getApps().length === 0) {
          admin.initializeApp({
            credential: admin.cert(serviceAccount),
          });
          this.logger.log('Firebase Admin initialized for FCM v1');
        }
        this.firebaseApp = admin.getApp();
      } else {
        this.logger.warn('Firebase not configured — falling back to Expo Push API');
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
      let ok = 0;
      let fail = 0;
      if (result?.data) {
        for (const item of result.data) {
          if (item.status === 'error') {
            fail++;
            this.logger.error(`Expo push error for ${(item.message || 'unknown') as string}: ${JSON.stringify(item.details || {})}`);
          } else {
            ok++;
          }
        }
      }
      this.logger.log(`Expo push: ${ok} enviados, ${fail} fallaron`);
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

    const expoTokens = tokens.filter((t) => t.startsWith('ExponentPushToken'));
    const fcmTokens = tokens.filter((t) => !t.startsWith('ExponentPushToken'));

    // Expo Push API (para ExponentPushToken[...])
    if (expoTokens.length > 0) {
      const messages: PushMessage[] = expoTokens.map((token) => ({
        to: token,
        title,
        body,
        data,
        channelId: 'fitosanitario',
        sound: 'default',
        priority: 'high',
      }));
      await this.sendViaExpo(messages);
    }

    // FCM v1 (para tokens nativos como los de getDevicePushTokenAsync)
    if (fcmTokens.length > 0 && this.firebaseApp) {
      try {
        const { getMessaging } = require('firebase-admin/messaging');
        const fcmData: Record<string, string> = {};
        // Expo Notifications en Android necesita channelId y sound en el data payload
        // para usar el canal correcto y reproducir sonido
        fcmData.channelId = 'fitosanitario';
        fcmData.sound = 'default';
        if (data) {
          for (const [key, value] of Object.entries(data)) {
            fcmData[key] = String(value ?? '');
          }
        }

        const response = await getMessaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: { title, body },
          data: fcmData,
        });

        this.logger.log(
          `FCM v1 enviados: ${response.successCount} OK, ${response.failureCount} fallaron`,
        );
      } catch (err: any) {
        this.logger.error('FCM v1 error:', err?.message ?? err);
      }
    }
  }
}
