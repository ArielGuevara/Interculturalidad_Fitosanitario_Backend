import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Reporte } from '../../../domain/reportes/types';
import { getReportes } from '../../../infrastructure/data/reportes/reportesApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'reportes.list';

export function ReportesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReportes();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Reporte[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
      } else {
        Alert.alert('Sin conexión', 'No hay reportes en caché todavía.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-row gap-2">
        <Pressable
          className={`flex-1 rounded-xl bg-emerald-600 px-4 py-3 ${loading ? 'opacity-60' : ''}`}
          onPress={load}
          disabled={loading}
        >
          <Text className="text-center font-semibold text-white">{loading ? 'Actualizando...' : 'Actualizar'}</Text>
        </Pressable>
        <Pressable
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3"
          onPress={() => navigation.navigate('CreateReporte')}
        >
          <Text className="text-center font-semibold text-slate-800">Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-xl border border-slate-200 p-4"
            onPress={() => navigation.navigate('ReporteDetail', { id: item.id })}
          >
            <Text className="text-lg font-semibold text-slate-900">{item.titulo}</Text>
            {!!item.descripcion && <Text className="mt-1 text-slate-600">{item.descripcion}</Text>}
            <Text className="mt-2 text-slate-500">Cultivo: {item.cultivoId} - Usuario: {item.usuarioId}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}