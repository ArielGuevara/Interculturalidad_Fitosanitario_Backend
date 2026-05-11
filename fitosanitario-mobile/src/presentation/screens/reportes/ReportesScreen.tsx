import React, { useEffect, useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { Reporte } from '../../../domain/reportes/types';
import { getReportes } from '../../../infrastructure/data/reportes/reportesApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { LinearGradient } from 'expo-linear-gradient';

const CACHE_KEY = 'reportes.list';

// Componente para animar las tarjetas al presionarlas
function AnimatedCard({ item, onPress }: { item: Reporte, onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📋</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.titulo}</Text>
            {!!item.descripcion ? (
              <Text style={styles.description} numberOfLines={2}>{item.descripcion}</Text>
            ) : (
              <Text style={styles.noDescription}>Sin observaciones</Text>
            )}
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Metadatos en formato de "Badges" */}
        <View style={styles.metadataRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🌱</Text>
            <Text style={styles.badgeText}>Ref: {item.cultivoId}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
            <Text style={styles.badgeIcon}>👤</Text>
            <Text style={[styles.badgeText, { color: '#0284c7' }]}>Usr: {item.usuarioId}</Text>
          </View>
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

  useEffect(() => {
    loadData();
  }, []);

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyTitle}>Bandeja vacía</Text>
        <Text style={styles.emptyText}>
          No has creado ningún reporte aún.{'\n'}Toca el botón "+" para empezar.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        
        <Text style={styles.headerSubtitle}>
          {items.length === 1 ? '1 documento' : `${items.length} documentos`} registrados
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
    paddingBottom: 100, // Espacio extra al fondo para que el FAB no tape el último elemento
    paddingTop: 8,
  },
  
  // Diseño de la Tarjeta
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
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
  arrowContainer: {
    marginLeft: 10,
  },
  arrow: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },

  // Divisor interno de la tarjeta
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },

  // Metadatos (Badges)
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4', // Verde muy claro por defecto
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a', // Texto verde
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
  },
  emptyEmoji: {
    fontSize: 54,
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