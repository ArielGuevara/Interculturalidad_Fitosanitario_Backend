import React, { useEffect, useState, useMemo } from 'react';
import { 
  Alert, 
  FlatList, 
  Pressable,
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';
import { getTratamientos } from '../../../infrastructure/data/catalogos/tratamientosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';
import { SearchBar } from '../../../presentation/components/SearchBar';

const CACHE_KEY = 'tratamientos.list';

export function TratamientosScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<TratamientoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.producto.nombreComercial.toLowerCase().includes(q) ||
      i.cultivo.nombre.toLowerCase().includes(q) ||
      i.plaga.nombre.toLowerCase().includes(q) ||
      (i.metodoAplicacion && i.metodoAplicacion.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const data = await getTratamientos();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<TratamientoConRelaciones[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
      } else {
        Alert.alert('Sin conexión', 'No hay datos en caché todavía. Conéctate a internet para la primera carga.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metodoBadgeColor = (metodo: string) => {
    switch (metodo) {
      case 'FOLIAR': return '#16a34a';
      case 'SUELO': return '#b45309';
      case 'RIEGO': return '#2563eb';
      default: return '#64748b';
    }
  };

  const renderItem = ({ item }: { item: TratamientoConRelaciones }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('TratamientoDetail', { id: item.id })}>
      <View style={styles.iconContainer}>
        <Ionicons name="medkit" size={32} color="#2563eb" />
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.producto.nombreComercial}
          </Text>
          <View style={[styles.badge, { backgroundColor: metodoBadgeColor(item.metodoAplicacion) + '20' }]}>
            <Text style={[styles.badgeText, { color: metodoBadgeColor(item.metodoAplicacion) }]}>
              {item.metodoAplicacion}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="leaf-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>{item.cultivo.nombre}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="bug-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>{item.plaga.nombre}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="flask-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>
            {item.dosis} {item.unidadDosis}{item.volumenAgua ? ` / ${item.volumenAgua} ${item.unidadVolumen}` : ''}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>
            {item.intervaloDias}d · {item.numeroAplicaciones} aplicaciones · Carencia: {item.diasCarencia}d
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medkit-outline" size={54} color="#94a3b8" />
        <Text style={styles.emptyTitle}>No hay tratamientos</Text>
        <Text style={styles.emptyText}>
          Desliza hacia abajo para actualizar e intentar nuevamente.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Tratamientos</Text>
        <Text style={styles.headerSubtitle}>
          {searchQuery ? `${filteredItems.length} de ${items.length} registros` : `${items.length} registros disponibles`}
        </Text>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar tratamientos..." />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(true)} 
              tintColor="#2563eb"
              colors={['#2563eb']}
            />
          }
        />
      )}

      <ImageViewerModal
        visible={selectedImage !== null}
        imageUrl={selectedImage ?? ''}
        onClose={() => setSelectedImage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
