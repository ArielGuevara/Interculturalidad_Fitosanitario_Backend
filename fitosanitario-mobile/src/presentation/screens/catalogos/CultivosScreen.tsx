import React, { useEffect, useState, useMemo } from 'react';
import { 
  Alert, 
  FlatList, 
  Image,
  Pressable,
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Cultivo } from '../../../domain/catalogos/types';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { fixMediaUrl } from '../../../shared/utils/mediaUrl';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';
import { SearchBar } from '../../../presentation/components/SearchBar';

const CACHE_KEY = 'cultivos.list';
const PAGE_SIZE = 5;

export function CultivosScreen() {
  const [items, setItems] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Cultivo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = normalize(searchQuery.toLowerCase());
    return items.filter(i =>
      normalize(i.nombre.toLowerCase()).includes(q) ||
      (i.descripcion && normalize(i.descripcion.toLowerCase()).includes(q))
    );
  }, [items, searchQuery]);

  const displayedItems = useMemo(() => filteredItems.slice(0, page * PAGE_SIZE), [filteredItems, page]);
  const hasMore = displayedItems.length < filteredItems.length;

  useEffect(() => { setPage(1); }, [searchQuery]);

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
      {/* Imagen o icono representativo */}
      {item.imagenUrl ? (
        <Pressable onPress={() => setSelectedImage(item.imagenUrl!)}>
          <Image source={{ uri: fixMediaUrl(item.imagenUrl)! }} style={styles.image} resizeMode="cover" />
        </Pressable>
      ) : (
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={32} color="#16a34a" />
        </View>
      )}
      
      {/* Información */}
      <Pressable style={styles.textContainer} onPress={() => setSelectedItem(item)}>
        <Text style={styles.title}>{item.nombre}</Text>
        {!!item.descripcion ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : (
          <Text style={styles.noDescription}>Sin descripción disponible</Text>
        )}
      </Pressable>
    </View>
  );

  const renderEmptyComponent = () => {
    if (loading) return null; // Evita parpadeos mientras carga la primera vez
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={54} color="#94a3b8" />
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
        <Text style={styles.headerSubtitle}>
          {searchQuery ? `${filteredItems.length} de ${items.length} registros` : `${items.length} registros disponibles`}
        </Text>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar cultivos..." />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={hasMore ? (
            <Pressable style={styles.loadMoreBtn} onPress={() => setPage(p => p + 1)}>
              <Text style={styles.loadMoreText}>Ver más ({filteredItems.length - displayedItems.length} restantes)</Text>
            </Pressable>
          ) : null}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(true)} 
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
        />
      )}

      <ImageViewerModal
        visible={selectedImage !== null}
        imageUrl={selectedImage ?? ''}
        onClose={() => setSelectedImage(null)}
      />

      <Modal visible={selectedItem !== null} animationType="fade" transparent onRequestClose={() => setSelectedItem(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {selectedItem?.imagenUrl && (
              <Image source={{ uri: fixMediaUrl(selectedItem.imagenUrl)! }} style={styles.modalImage} resizeMode="contain" />

            )}
            <Text style={styles.modalTitle}>{selectedItem?.nombre}</Text>
            <Text style={styles.modalDescription}>{selectedItem?.descripcion || 'Sin descripción disponible'}</Text>
            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  image: {
    width: 56, height: 56, borderRadius: 16, marginRight: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
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

  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});