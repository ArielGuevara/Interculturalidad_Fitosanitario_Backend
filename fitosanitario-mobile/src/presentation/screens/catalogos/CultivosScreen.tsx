import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  FlatList, 
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import type { Cultivo } from '../../../domain/catalogos/types';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'cultivos.list';

export function CultivosScreen() {
  const [items, setItems] = useState<Cultivo[]>([]);
  // 'loading' para la primera carga, 'refreshing' para cuando el usuario desliza
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const data = await getCultivos();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Cultivo[]>(CACHE_KEY);
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

  const renderItem = ({ item }: { item: Cultivo }) => (
    <View style={styles.card}>
      {/* Icono representativo del cultivo */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🌱</Text>
      </View>
      
      {/* Información */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.nombre}</Text>
        {!!item.descripcion ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : (
          <Text style={styles.noDescription}>Sin descripción disponible</Text>
        )}
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (loading) return null; // Evita parpadeos mientras carga la primera vez
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🍃</Text>
        <Text style={styles.emptyTitle}>No hay cultivos</Text>
        <Text style={styles.emptyText}>
          Desliza hacia abajo para actualizar e intentar nuevamente.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Cultivos</Text>
        <Text style={styles.headerSubtitle}>{items.length} registros disponibles</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(true)} 
              tintColor="#10b981"
              colors={['#10b981']} // Color para Android
            />
          }
        />
      )}
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
  
  // Diseño de la Tarjeta (Glass effect / Clean)
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#f0fdf4', // Fondo verde muy claro
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  noDescription: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Estados de carga y vacío
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
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