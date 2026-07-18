import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { registrarDispositivo } from '../../infrastructure/data/alertas/alertasApi';

let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {}
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

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('fitosanitario', {
        name: 'Notificaciones Fitosanitario',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
      });
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (projectId) {
      try {
        const expoTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('[Push] Expo push token:', expoTokenData.data);
        return expoTokenData.data;
      } catch (err: any) {
        console.warn('[Push] Expo token failed, falling back to FCM:', err?.message ?? err);
      }
    }

    try {
      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      console.log('[Push] FCM device token:', devicePushToken.data);
      return devicePushToken.data;
    } catch (err: any) {
      console.warn('[Push] FCM token also failed:', err?.message ?? err);
      return null;
    }
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
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const tokenRegistered = useRef(false);
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    if (!Notifications || !Device || !usuario || tokenRegistered.current) return;

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

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          console.log('[Push] Notification RECEIVED:', JSON.stringify({ title: notification?.request?.content?.title, body: notification?.request?.content?.body }));
        },
      );
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response?.notification?.request?.content?.data as NotificationPayload | undefined;
          console.log('[Push] Notification tapped:', data);
          onNotificationTap?.(data);
        },
      );
    } catch (err: any) {
      console.warn('[Push] Error setting up listeners:', err?.message ?? err);
    }

    return () => {
      if (notificationListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
        Notifications.removeNotificationSubscription(notificationListener.current);
      } else if (notificationListener.current && typeof Notifications.removeSubscription === 'function') {
        Notifications.removeSubscription(notificationListener.current);
      }
      if (responseListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
        Notifications.removeNotificationSubscription(responseListener.current);
      } else if (responseListener.current && typeof Notifications.removeSubscription === 'function') {
        Notifications.removeSubscription(responseListener.current);
      }
    };
  }, [usuario, onNotificationTap]);
}
