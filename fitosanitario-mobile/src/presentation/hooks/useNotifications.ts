import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { registrarDispositivo } from '../../infrastructure/data/alertas/alertasApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }

  return token;
}

export function useNotifications(onNotificationTap?: () => void) {
  const notificationListener = useRef<Notifications.EventSubscription>(null!);
  const responseListener = useRef<Notifications.EventSubscription>(null!);
  const tokenRegistered = useRef(false);

  useEffect(() => {
    const setup = async () => {
      const usuario = useAuthStore.getState().usuario;
      if (!usuario || tokenRegistered.current) return;

      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      try {
        const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
        await registrarDispositivo(token, plataforma);
        tokenRegistered.current = true;
      } catch {
        // ya registrado o error de red
      }
    };

    setup();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      onNotificationTap?.();
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onNotificationTap]);
}
