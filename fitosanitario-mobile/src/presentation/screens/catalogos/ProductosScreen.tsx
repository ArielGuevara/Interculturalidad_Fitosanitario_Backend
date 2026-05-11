import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import type { Producto } from '../../../domain/catalogos/types';
import { getProductos } from '../../../infrastructure/data/catalogos/productosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'productos.list';

export function ProductosScreen() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProductos();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Producto[]>(CACHE_KEY);
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
            <Text className="text-lg font-semibold text-slate-900">{item.nombreComercial}</Text>
            <Text className="mt-1 text-slate-600">Tipo: {item.tipo}</Text>
            {!!item.ingredienteActivo && (
              <Text className="mt-1 text-slate-600">Activo: {item.ingredienteActivo}</Text>
            )}
            {!!item.unidadBase && <Text className="mt-1 text-slate-600">Unidad: {item.unidadBase}</Text>}
          </View>
        )}
      />
    </View>
  );
}