import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function CatalogosScreen() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-semibold text-slate-900">Catálogos</Text>
      <Text className="mt-1 text-slate-600">Disponibles sin conexión (si ya se consultaron)</Text>

      <Pressable
        className="mt-6 rounded-xl border border-slate-200 px-4 py-4"
        onPress={() => navigation.navigate('Cultivos')}
      >
        <Text className="text-center text-slate-800">Cultivos</Text>
      </Pressable>

      <Pressable
        className="mt-3 rounded-xl border border-slate-200 px-4 py-4"
        onPress={() => navigation.navigate('Plagas')}
      >
        <Text className="text-center text-slate-800">Plagas / Enfermedades</Text>
      </Pressable>

      <Pressable
        className="mt-3 rounded-xl border border-slate-200 px-4 py-4"
        onPress={() => navigation.navigate('Productos')}
      >
        <Text className="text-center text-slate-800">Productos fitosanitarios</Text>
      </Pressable>
    </View>
  );
}