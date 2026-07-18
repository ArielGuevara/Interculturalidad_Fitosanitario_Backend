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
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Producto, Plaga, Cultivo } from '../../../domain/catalogos/types';
import { getProductos, getAsociaciones } from '../../../infrastructure/data/catalogos/productosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { SearchBar } from '../../../presentation/components/SearchBar';

const CACHE_KEY = 'productos.list';

export function ProductosScreen() {
  const [items, setItems] = useState<Producto[]>([]);
  const [plagas, setPlagas] = useState<Plaga[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Producto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlagaId, setSelectedPlagaId] = useState<number | null>(null);
  const [selectedCultivoId, setSelectedCultivoId] = useState<number | null>(null);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredByPlaga = useMemo(() => {
    if (!selectedPlagaId) return items;
    return items.filter(i =>
      i.pairs?.some(p => p.plagaId === selectedPlagaId)
    );
  }, [items, selectedPlagaId]);

  const filteredByCultivo = useMemo(() => {
    if (!selectedCultivoId) return filteredByPlaga;
    return filteredByPlaga.filter(i =>
      i.pairs?.some(p => p.cultivoId === selectedCultivoId)
    );
  }, [filteredByPlaga, selectedCultivoId]);

  const filteredItems = useMemo(() => {
    let source = filteredByCultivo;
    if (!searchQuery.trim()) return source;
    const q = normalize(searchQuery.toLowerCase());
    return source.filter(i =>
      normalize(i.nombreComercial.toLowerCase()).includes(q) ||
      (i.ingredienteActivo && normalize(i.ingredienteActivo.toLowerCase()).includes(q)) ||
      (i.tipo && normalize(i.tipo.toLowerCase()).includes(q))
    );
  }, [filteredByCultivo, searchQuery]);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      const [productosData, asociaciones, plagasData, cultivosData] = await Promise.all([
        getProductos(),
        getAsociaciones(),
        getPlagas(),
        getCultivos(),
      ]);
      const map: Record<number, { plagaId: number; plagaNombre: string; cultivoId: number; cultivoNombre: string }[]> = {};
      for (const a of asociaciones) {
        if (!map[a.productoId]) map[a.productoId] = [];
        map[a.productoId].push({ plagaId: a.plagaId, plagaNombre: a.plagaNombre, cultivoId: a.cultivoId, cultivoNombre: a.cultivoNombre });
      }
      const merged = productosData.map(p => ({ ...p, pairs: map[p.id] || [] }));
      setItems(merged);
      setPlagas(plagasData);
      setCultivos(cultivosData);
      await setCache(CACHE_KEY, merged);
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
    <Pressable style={styles.card} onPress={() => setSelectedItem(item)}>
      <View style={styles.iconContainer}>
        <Ionicons name="flask" size={32} color="#2563eb" />
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.nombreComercial}</Text>
          {!!item.tipo && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.tipo}</Text>
            </View>
          )}
        </View>

        {!!item.ingredienteActivo && (
          <Text style={styles.activeIngredient} numberOfLines={2}>
            <Text style={styles.activeLabel}>Activo:</Text> {item.ingredienteActivo}
          </Text>
        )}
        
        {!!item.unidadBase && (
          <Text style={styles.unitText}>
            <Text style={styles.unitLabel}>Presentación:</Text> {item.unidadBase}
          </Text>
        )}

        {item.pairs && item.pairs.length > 0 && (
          <View style={styles.pairRow}>
            {item.pairs.slice(0, 3).map(p => (
              <View key={`${p.plagaId}-${p.cultivoId}`} style={styles.pairBadge}>
                <Text style={styles.pairBadgePlaga}>{p.plagaNombre}</Text>
                <Text style={styles.pairBadgeCultivo}>{p.cultivoNombre}</Text>
              </View>
            ))}
            {item.pairs.length > 3 && (
              <Text style={styles.pairMore}>+{item.pairs.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={54} color="#94a3b8" />
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
        <Text style={styles.headerSubtitle}>
          {searchQuery || selectedPlagaId || selectedCultivoId
            ? `${filteredItems.length} de ${items.length} productos`
            : `${items.length} productos disponibles`}
        </Text>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar productos..." />

      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <Pressable style={[styles.chip, !selectedPlagaId && styles.chipActive]} onPress={() => setSelectedPlagaId(null)}>
            <Text style={[styles.chipText, !selectedPlagaId && styles.chipTextActive]}>Plagas: Todas</Text>
          </Pressable>
          {plagas.map(p => (
            <Pressable key={p.id} style={[styles.chip, selectedPlagaId === p.id && styles.chipActive]} onPress={() => setSelectedPlagaId(p.id)}>
              <Text style={[styles.chipText, selectedPlagaId === p.id && styles.chipTextActive]}>{p.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <Pressable style={[styles.chip, !selectedCultivoId && styles.chipActive]} onPress={() => setSelectedCultivoId(null)}>
            <Text style={[styles.chipText, !selectedCultivoId && styles.chipTextActive]}>Cultivos: Todos</Text>
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
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
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
              tintColor="#0ea5e9"
              colors={['#0ea5e9']}
            />
          }
        />
      )}

      <Modal visible={selectedItem !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedItem?.nombreComercial}</Text>
            {selectedItem?.tipo && (
              <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>{selectedItem.tipo}</Text></View>
            )}
            {!!selectedItem?.ingredienteActivo && (
              <Text style={styles.modalDetail}><Text style={styles.modalLabel}>Activo:</Text> {selectedItem.ingredienteActivo}</Text>
            )}
            {!!selectedItem?.unidadBase && (
              <Text style={styles.modalDetail}><Text style={styles.modalLabel}>Presentación:</Text> {selectedItem.unidadBase}</Text>
            )}

            {selectedItem?.pairs && selectedItem.pairs.length > 0 && (
              <>
                <Text style={styles.modalSectionTitle}>Plagas / Cultivos Asociados</Text>
                {(() => {
                  const grouped = new Map<number, { nombre: string; cultivos: string[] }>();
                  for (const p of selectedItem.pairs) {
                    if (!grouped.has(p.plagaId)) grouped.set(p.plagaId, { nombre: p.plagaNombre, cultivos: [] });
                    grouped.get(p.plagaId)!.cultivos.push(p.cultivoNombre);
                  }
                  return Array.from(grouped.entries()).map(([plagaId, g]) => (
                    <View key={plagaId} style={styles.modalPairGroup}>
                      <Text style={styles.modalPlagaName}>{g.nombre}</Text>
                      <View style={styles.modalChipRow}>
                        {g.cultivos.map(cn => (
                          <View key={cn} style={styles.modalChip}><Text style={styles.modalChipText}>{cn}</Text></View>
                        ))}
                      </View>
                    </View>
                  ));
                })()}
              </>
            )}

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
    paddingBottom: 8,
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
    backgroundColor: '#f0f9ff',
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
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  
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
    color: '#0ea5e9',
    textTransform: 'uppercase',
  },

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
    marginBottom: 4,
  },
  unitLabel: {
    fontWeight: '600',
  },

  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  pairBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pairBadgePlaga: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  pairBadgeCultivo: {
    fontSize: 9,
    fontWeight: '500',
    color: '#15803d',
  },
  pairMore: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 2,
  },

  chipsSection: {
    paddingBottom: 4,
  },
  chipsScroll: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 6,
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
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
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
  modalTitle: {
    fontSize: 22,
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
  modalDetail: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  modalLabel: {
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  modalPairGroup: {
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  modalPlagaName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  modalCloseBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
