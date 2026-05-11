import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import type { Plaga } from '../../../domain/catalogos/types';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'plagas.list';

export function PlagasScreen() {
  const [items, setItems] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPlagas();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Plaga[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
      } else {
        Alert.alert('Sin conexión', 'No hay datos en caché todavía.');
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
      <Pressable className="rounded-xl bg-emerald-600 px-4 py-3" onPress={load} disabled={loading}>
        <Text className="text-center font-semibold text-white">{loading ? 'Actualizando...' : 'Actualizar'}</Text>
      </Pressable>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-xl border border-slate-200 p-4">
            <Text className="text-lg font-semibold text-slate-900">{item.nombre}</Text>
            <Text className="mt-1 text-slate-600">Tipo: {item.tipo}</Text>
            {!!item.descripcion && <Text className="mt-1 text-slate-600">{item.descripcion}</Text>}
          </View>
        )}
      />
    </View>
  );
}