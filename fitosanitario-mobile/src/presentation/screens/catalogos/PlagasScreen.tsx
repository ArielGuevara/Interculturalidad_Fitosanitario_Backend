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
import type { Cultivo, Plaga } from '../../../domain/catalogos/types';
import { getPlagas, getAsociaciones } from '../../../infrastructure/data/catalogos/plagasApi';
import { fixMediaUrl } from '../../../shared/utils/mediaUrl';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';
import { SearchBar } from '../../../presentation/components/SearchBar';

const CACHE_KEY = 'plagas.list';
const PAGE_SIZE = 5;

export function PlagasScreen() {
  const [items, setItems] = useState<Plaga[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Plaga | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCultivoId, setSelectedCultivoId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredByCrop = useMemo(() => {
    if (!selectedCultivoId) return items;
    return items.filter(i =>
      i.cultivos?.some(c => c.id === selectedCultivoId)
    );
  }, [items, selectedCultivoId]);

  const filteredItems = useMemo(() => {
    let source = filteredByCrop;
    if (!searchQuery.trim()) return source;
    const q = normalize(searchQuery.toLowerCase());
    return source.filter(i =>
      normalize(i.nombre.toLowerCase()).includes(q) ||
      (i.descripcion && normalize(i.descripcion.toLowerCase()).includes(q)) ||
      (i.tipo && normalize(i.tipo.toLowerCase()).includes(q))
    );
  }, [filteredByCrop, searchQuery]);

  const displayedItems = useMemo(() => filteredItems.slice(0, page * PAGE_SIZE), [filteredItems, page]);
  const hasMore = displayedItems.length < filteredItems.length;

  useEffect(() => { setPage(1); }, [searchQuery, selectedCultivoId]);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const [plagasData, asociaciones, cultivosData] = await Promise.all([
        getPlagas(),
        getAsociaciones(),
        getCultivos(),
      ]);
      const map: Record<number, { id: number; nombre: string }[]> = {};
      for (const a of asociaciones) {
        if (!map[a.plagaId]) map[a.plagaId] = [];
        map[a.plagaId].push({ id: a.id, nombre: a.nombre });
      }
      const merged = plagasData.map(p => ({ ...p, cultivos: map[p.id] || [] }));
      setItems(merged);
      setCultivos(cultivosData);
      await setCache(CACHE_KEY, merged);
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
      {/* Imagen o icono */}
      {item.imagenUrl ? (
        <Pressable onPress={() => setSelectedImage(item.imagenUrl!)}>
          <Image source={{ uri: fixMediaUrl(item.imagenUrl)! }} style={styles.image} resizeMode="cover" />
        </Pressable>
      ) : (
        <View style={styles.iconContainer}>
          <Ionicons name="bug" size={32} color="#dc2626" />
        </View>
      )}
      
      {/* Información principal */}
      <Pressable style={styles.textContainer} onPress={() => setSelectedItem(item)}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.nombre}</Text>
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

        {item.cultivos && item.cultivos.length > 0 && (
          <View style={styles.cropRow}>
            <Ionicons name="leaf" size={12} color="#059669" />
            {item.cultivos.map(c => (
              <View key={c.id} style={styles.cropBadge}>
                <Text style={styles.cropBadgeText}>{c.nombre}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );

  // Pantalla cuando no hay datos
  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bug-outline" size={54} color="#94a3b8" />
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
        <Text style={styles.headerSubtitle}>
          {searchQuery ? `${filteredItems.length} de ${items.length} registros` : `${items.length} registros disponibles`}
        </Text>
      </View>

      {/* Filtros: búsqueda + cultivo */}
      <View style={styles.filterSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar plagas..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <Pressable style={[styles.chip, !selectedCultivoId && styles.chipActive]} onPress={() => setSelectedCultivoId(null)}>
            <Text style={[styles.chipText, !selectedCultivoId && styles.chipTextActive]}>Todos</Text>
          </Pressable>
          {cultivos.map(c => (
            <Pressable key={c.id} style={[styles.chip, selectedCultivoId === c.id && styles.chipActive]} onPress={() => setSelectedCultivoId(c.id)}>
              <Text style={[styles.chipText, selectedCultivoId === c.id && styles.chipTextActive]}>{c.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
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
              tintColor="#e11d48"
              colors={['#e11d48']}
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
      <ScrollView contentContainerStyle={styles.modalContentInner}>
        {selectedItem?.imagenUrl && (
          <Image source={{ uri: fixMediaUrl(selectedItem.imagenUrl)! }} style={styles.modalImage} resizeMode="contain" />

        )}
        <Text style={styles.modalTitle}>{selectedItem?.nombre}</Text>
        {selectedItem && 'tipo' in selectedItem && selectedItem.tipo && (
          <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>{selectedItem.tipo}</Text></View>
        )}
        {selectedItem?.cultivos && selectedItem.cultivos.length > 0 && (
          <View style={styles.modalCropRow}>
            <Ionicons name="leaf" size={14} color="#059669" />
            {selectedItem.cultivos.map(c => (
              <View key={c.id} style={styles.modalCropBadge}>
                <Text style={styles.modalCropBadgeText}>{c.nombre}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.modalDescription}>{selectedItem?.descripcion || 'Sin descripción disponible'}</Text>
        <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
          <Text style={styles.modalCloseText}>Cerrar</Text>
        </Pressable>
      </ScrollView>
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
  image: {
    width: 56, height: 56, borderRadius: 16, marginRight: 16,
  },
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

  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 4,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '70%',
  },
  modalContentInner: {
    padding: 20,
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
  modalBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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

  filterSection: {
    paddingBottom: 4,
  },
  chipsScroll: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 8,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  cropBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  cropBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modalCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  modalCropBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  modalCropBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});