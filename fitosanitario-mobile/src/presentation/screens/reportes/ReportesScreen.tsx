import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Alert, 
  FlatList, 
  Pressable, 
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { Reporte } from '../../../domain/reportes/types';
import { getReportes } from '../../../infrastructure/data/reportes/reportesApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { LinearGradient } from 'expo-linear-gradient';

const CACHE_KEY = 'reportes.list';

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  COMUNIDAD: '#3b82f6',
  VALIDADO: '#10b981',
  RECHAZADO: '#ef4444',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  COMUNIDAD: 'En comunidad',
  VALIDADO: 'Validado',
  RECHAZADO: 'Rechazado',
};

// Componente para animar las tarjetas al presionarlas
function AnimatedCard({ item, onPress }: { item: Reporte, onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const estadoColor = ESTADO_COLORS[item.estado] || '#6b7280';
  const estadoLabel = ESTADO_LABELS[item.estado] || item.estado;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardTop}>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '18' }]}>
            <View style={[styles.estadoDot, { backgroundColor: estadoColor }]} />
            <Text style={[styles.estadoText, { color: estadoColor }]}>{estadoLabel}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>{item.titulo}</Text>
        {!!item.descripcion && (
          <Text style={styles.description} numberOfLines={2}>{item.descripcion}</Text>
        )}

        <View style={styles.metadataRow}>
          {item.cultivo && (
            <View style={styles.chip}>
              <Ionicons name="leaf" size={12} color="#16a34a" />
              <Text style={styles.chipText}> {item.cultivo.nombre}</Text>
            </View>
          )}
          {item.plaga && (
            <View style={[styles.chip, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Ionicons name="bug" size={12} color="#dc2626" />
              <Text style={[styles.chipText, { color: '#dc2626' }]}> {item.plaga.nombre}</Text>
            </View>
          )}
          {item.imagenesUrls && item.imagenesUrls.length > 0 && (
            <View style={styles.chip}>
              <Ionicons name="camera" size={12} color="#64748b" />
              <Text style={styles.chipText}> {item.imagenesUrls.length}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function ReportesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await getReportes();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Reporte[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
      } else {
        Alert.alert('Modo Offline', 'No hay reportes en caché. Conéctate para sincronizar.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={54} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Sin reportes</Text>
        <Text style={styles.emptyText}>
          Toca + para documentar un hallazgo en campo
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>
          {items.length === 1 ? '1 reporte' : `${items.length} reportes`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(true)} 
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
          renderItem={({ item }) => (
            <AnimatedCard 
              item={item} 
              onPress={() => navigation.navigate('ReporteDetail', { id: item.id })} 
            />
          )}
        />
      )}

      {/* Floating Action Button (FAB) para crear un nuevo reporte */}
      <Pressable 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReporte')}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </Pressable>
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
    paddingBottom: 12,
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
    paddingBottom: 100,
    paddingTop: 4,
  },
  
  // Diseño de la Tarjeta
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  // Metadatos (Chips)
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },

  // Estados
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
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 16,
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
    lineHeight: 22,
  },

  // Floating Action Button (FAB)
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2, // Ajuste óptico para centrar el símbolo "+"
  },
});