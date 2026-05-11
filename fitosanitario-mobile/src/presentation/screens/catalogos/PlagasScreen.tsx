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
import type { Plaga } from '../../../domain/catalogos/types';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';

const CACHE_KEY = 'plagas.list';

export function PlagasScreen() {
  const [items, setItems] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const data = await getPlagas();
      setItems(data);
      await setCache(CACHE_KEY, data);
    } catch {
      const cached = await getCache<Plaga[]>(CACHE_KEY);
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

  // Función para renderizar cada tarjeta de plaga
  const renderItem = ({ item }: { item: Plaga }) => (
    <View style={styles.card}>
      {/* Icono con fondo rojizo/rosado para diferenciar de cultivos */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🐛</Text> 
      </View>
      
      {/* Información principal */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.nombre}</Text>
          {/* Badge para el Tipo */}
          {!!item.tipo && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.tipo}</Text>
            </View>
          )}
        </View>

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

  // Pantalla cuando no hay datos
  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🦠</Text>
        <Text style={styles.emptyTitle}>No hay plagas registradas</Text>
        <Text style={styles.emptyText}>
          Desliza hacia abajo para actualizar el catálogo.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera Fija */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Plagas</Text>
        <Text style={styles.headerSubtitle}>{items.length} registros disponibles</Text>
      </View>

      {/* Cuerpo de la Lista o Cargando */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
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
              tintColor="#e11d48" // Tono rojo/rosa para plagas
              colors={['#e11d48']}
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
  // Icono diferenciado para plagas (fondo rojizo pálido)
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff1f2', 
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
  
  // Estilo del "Badge" para el tipo de plaga
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
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