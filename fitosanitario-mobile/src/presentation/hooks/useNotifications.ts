import { useEffect, useRef } from 'react';
import { Platform, NativeModules } from 'react-native';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { registrarDispositivo } from '../../infrastructure/data/alertas/alertasApi';

let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // expo-notifications no está disponible en Expo Go SDK 53+
  // Usar development build para notificaciones push
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
    if (!Device.isDevice) return null;

    let finalStatus = (await Notifications.getPermissionsAsync()).status;
    if (finalStatus !== 'granted') {
      finalStatus = (await Notifications.requestPermissionsAsync()).status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance?.MAX ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    }

    return tokenData.data;
  } catch {
    return null;
  }
}

export function useNotifications(onNotificationTap?: () => void) {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const tokenRegistered = useRef(false);

  useEffect(() => {
    if (!Notifications || !Device) return;

    const setup = async () => {
      try {
        const usuario = useAuthStore.getState().usuario;
        if (!usuario || tokenRegistered.current) return;

        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
        await registrarDispositivo(token, plataforma);
        tokenRegistered.current = true;
      } catch {}
    };

    setup();

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        onNotificationTap?.();
      });
    } catch {}
  }, [onNotificationTap]);
}