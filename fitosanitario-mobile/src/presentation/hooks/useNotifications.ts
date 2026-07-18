import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { registrarDispositivo } from '../../infrastructure/data/alertas/alertasApi';

let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device || !Notifications) return null;
  try {
    if (!Device.isDevice) {
      console.log('[Push] Not a physical device — push tokens only work on real devices');
      return null;
    }

    let finalStatus = (await Notifications.getPermissionsAsync()).status;
    if (finalStatus !== 'granted') {
      finalStatus = (await Notifications.requestPermissionsAsync()).status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    console.log('[Push] FCM device token:', devicePushToken.data);
    return devicePushToken.data;
  } catch (err: any) {
    console.warn('[Push] Error getting push token:', err?.message ?? err);
    return null;
  }
}

export type NotificationPayload = {
  type?: string;
  reporteId?: number;
  tratamientoId?: number;
  recomendacionId?: number;
  suspensionId?: number;
  [key: string]: any;
};

export function useNotifications(onNotificationTap?: (data?: NotificationPayload) => void) {
  const tokenRegistered = useRef(false);
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    if (!Notifications || !Device || !usuario) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('fitosanitario', {
        name: 'Notificaciones Fitosanitario',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
      })
        .then(() => console.log('[Push] Android channel created'))
        .catch((e: any) => console.warn('[Push] Channel creation failed:', e?.message ?? e));
    }

    if (!tokenRegistered.current) {
      (async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (!token) return;
          const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
          await registrarDispositivo(token, plataforma);
          console.log('[Push] Token registered with backend:', token);
          tokenRegistered.current = true;
        } catch (err: any) {
          console.warn('[Push] Token registration failed:', err?.message ?? err);
        }
      })();
    }

    const notificationSub = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log('[Push] Notification RECEIVED:', JSON.stringify({ title: notification?.request?.content?.title, body: notification?.request?.content?.body }));
      },
    );
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response?.notification?.request?.content?.data as NotificationPayload | undefined;
        console.log('[Push] Notification tapped:', data);
        onNotificationTap?.(data);
      },
    );

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, [usuario, onNotificationTap]);
}
