import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';

export function ProfileScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-semibold text-slate-900">Perfil</Text>
      <View className="mt-4 rounded-xl border border-slate-200 p-4">
        <Text className="text-slate-700">Nombre: {usuario?.nombre ?? '-'}</Text>
        <Text className="mt-1 text-slate-700">Email: {usuario?.email ?? '-'}</Text>
        <Text className="mt-1 text-slate-700">Rol: {usuario?.rol ?? '-'}</Text>
      </View>

      <Pressable className="mt-6 rounded-xl border border-slate-200 px-4 py-4" onPress={logout}>
        <Text className="text-center font-semibold text-slate-800">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}