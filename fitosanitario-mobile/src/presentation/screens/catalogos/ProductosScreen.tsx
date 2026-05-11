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
import type { Producto } from '../../../domain/catalogos/types';
import { getProductos } from '../../../infrastructure/data/catalogos/productosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'productos.list';

export function ProductosScreen() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const data = await getProductos();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Producto[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
      } else {
        Alert.alert('Sin conexión', 'No hay datos en caché todavía. Conéctate a internet para sincronizar.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderItem = ({ item }: { item: Producto }) => (
    <View style={styles.card}>
      {/* Icono con fondo azul pálido para productos */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🧪</Text>
      </View>
      
      {/* Información principal */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.nombreComercial}</Text>
          {/* Badge para el Tipo de Producto (ej. FUNGICIDA, HERBICIDA) */}
          {!!item.tipo && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.tipo}</Text>
            </View>
          )}
        </View>

        {/* Detalles Técnicos */}
        {!!item.ingredienteActivo && (
          <Text style={styles.activeIngredient} numberOfLines={2}>
            🔬 <Text style={styles.activeLabel}>Activo:</Text> {item.ingredienteActivo}
          </Text>
        )}
        
        {!!item.unidadBase && (
          <Text style={styles.unitText}>
            📦 <Text style={styles.unitLabel}>Presentación:</Text> {item.unidadBase}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyTitle}>No hay productos</Text>
        <Text style={styles.emptyText}>
          Desliza hacia abajo para actualizar el vademécum.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicina para plagas</Text>
        <Text style={styles.headerSubtitle}>{items.length} productos disponibles</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
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
              tintColor="#0ea5e9" // Azul claro
              colors={['#0ea5e9']}
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
  
  // Diseño de la Tarjeta
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
    backgroundColor: '#f0f9ff', // Fondo azul muy claro
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  
  // Badge para tipo de producto
  badge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0ea5e9', // Azul para destacar
    textTransform: 'uppercase',
  },

  // Detalles Técnicos
  activeIngredient: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  activeLabel: {
    fontWeight: '700',
    color: '#334155',
  },
  unitText: {
    fontSize: 12,
    color: '#64748b',
  },
  unitLabel: {
    fontWeight: '600',
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