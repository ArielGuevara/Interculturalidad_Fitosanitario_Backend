import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { syncPendingReportes } from '../../../infrastructure/offline/sync';
import { Alert } from 'react-native';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);

  const onSync = async () => {
    const result = await syncPendingReportes();
    Alert.alert('Sincronización', `Enviados: ${result.synced}\nFallidos: ${result.failed}`);
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-semibold text-slate-900">Hola{usuario ? `, ${usuario.nombre}` : ''}</Text>
      <Text className="mt-1 text-slate-600">Rol: {usuario?.rol ?? '-'}</Text>

      <Pressable
        className="mt-6 rounded-xl bg-emerald-600 px-4 py-4"
        onPress={() => navigation.navigate('CreateReporte')}
      >
        <Text className="text-center font-semibold text-white">Crear reporte</Text>
      </Pressable>

      <Pressable className="mt-3 rounded-xl border border-slate-200 px-4 py-4" onPress={onSync}>
        <Text className="text-center font-semibold text-slate-800">Sincronizar pendientes</Text>
      </Pressable>

      <View className="mt-8">
        <Text className="text-slate-700">Accesos rápidos</Text>
        <View className="mt-3 flex-row gap-2">
          <Pressable
            className="flex-1 rounded-xl border border-slate-200 px-4 py-4"
            onPress={() => navigation.navigate('Cultivos')}
          >
            <Text className="text-center text-slate-800">Cultivos</Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-xl border border-slate-200 px-4 py-4"
            onPress={() => navigation.navigate('Plagas')}
          >
            <Text className="text-center text-slate-800">Plagas</Text>
          </Pressable>
        </View>
        <Pressable
          className="mt-2 rounded-xl border border-slate-200 px-4 py-4"
          onPress={() => navigation.navigate('Productos')}
        >
          <Text className="text-center text-slate-800">Productos</Text>
        </Pressable>
      </View>
    </View>
  );
}