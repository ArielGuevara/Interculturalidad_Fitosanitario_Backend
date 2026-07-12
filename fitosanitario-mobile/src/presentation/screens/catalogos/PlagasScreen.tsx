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
import type { Plaga } from '../../../domain/catalogos/types';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';
import { SearchBar } from '../../../presentation/components/SearchBar';

const CACHE_KEY = 'plagas.list';

export function PlagasScreen() {
  const [items, setItems] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Plaga | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.nombre.toLowerCase().includes(q) ||
      (i.descripcion && i.descripcion.toLowerCase().includes(q)) ||
      (i.tipo && i.tipo.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

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
      {/* Imagen o icono */}
      {item.imagenUrl ? (
        <Pressable onPress={() => setSelectedImage(item.imagenUrl!)}>
          <Image source={{ uri: item.imagenUrl }} style={styles.image} resizeMode="cover" />
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

      {/* Cuerpo de la Lista o Cargando */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar plagas..." />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
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
              tintColor="#e11d48" // Tono rojo/rosa para plagas
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

      <Modal visible={selectedItem !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedItem?.imagenUrl && (
              <Image source={{ uri: selectedItem.imagenUrl }} style={styles.modalImage} resizeMode="cover" />
            )}
            <Text style={styles.modalTitle}>{selectedItem?.nombre}</Text>
            {selectedItem && 'tipo' in selectedItem && selectedItem.tipo && (
              <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>{selectedItem.tipo}</Text></View>
            )}
            <Text style={styles.modalDescription}>{selectedItem?.descripcion || 'Sin descripción disponible'}</Text>
            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalDescription: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});