import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
  RefreshControl, SafeAreaView, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import type { Recomendacion, SaberAncestral } from '../../../domain/recomendaciones/types';
import type { Cultivo, Plaga } from '../../../domain/catalogos/types';
import { SearchBar } from '../../../presentation/components/SearchBar';

const TIPO_ICON: Record<string, any> = {
  RECOMENDACION: 'bulb-outline',
  CONSULTA: 'help-circle-outline',
  CONOCIMIENTO_ANCESTRAL: 'leaf-outline',
};

const TIPO_COLOR: Record<string, string> = {
  RECOMENDACION: '#059669',
  CONSULTA: '#d97706',
  CONOCIMIENTO_ANCESTRAL: '#7c3aed',
};

const TIPO_BG: Record<string, string> = {
  RECOMENDACION: '#d1fae5',
  CONSULTA: '#fef3c7',
  CONOCIMIENTO_ANCESTRAL: '#ede9fe',
};

type TabKey = 'foros' | 'saberes';

export function ForoScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);
  const [tabActivo, setTabActivo] = useState<TabKey>('foros');

  // Foros state
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroCultivoId, setFiltroCultivoId] = useState<number | undefined>();
  const [filtroPlagaId, setFiltroPlagaId] = useState<number | undefined>();
  const [showMisForos, setShowMisForos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Saberes state
  const [saberes, setSaberes] = useState<SaberAncestral[]>([]);
  const [loadingSaberes, setLoadingSaberes] = useState(false);
  const [searchSaberes, setSearchSaberes] = useState('');
  const [filtroCultivoSaber, setFiltroCultivoSaber] = useState<number | undefined>();

  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [plagas, setPlagas] = useState<Plaga[]>([]);

  // Select modals
  const [showTipoSelect, setShowTipoSelect] = useState(false);
  const [showCultivoSelect, setShowCultivoSelect] = useState(false);
  const [showPlagaSelect, setShowPlagaSelect] = useState(false);
  const [showCultivoSaberSelect, setShowCultivoSaberSelect] = useState(false);

  const tipos = [
    { key: 'RECOMENDACION', label: 'Recomendación', icon: 'bulb-outline', color: '#059669' },
    { key: 'CONSULTA', label: 'Consulta', icon: 'help-circle-outline', color: '#d97706' },
  ];

  const loadCatalogs = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([getCultivos(), getPlagas()]);
      setCultivos(c);
      setPlagas(p);
      await Promise.all([setCache('cultivos.list', c), setCache('plagas.list', p)]);
    } catch {
      const [cc, pp] = await Promise.all([getCache<Cultivo[]>('cultivos.list'), getCache<Plaga[]>('plagas.list')]);
      if (cc) setCultivos(cc);
      if (pp) setPlagas(pp);
    }
  }, []);

  const loadForos = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let data: Recomendacion[];
      if (showMisForos) {
        data = await recomendacionesApi.getMisRecomendaciones();
      } else {
        data = await recomendacionesApi.getAll({
          tipo: filtroTipo || undefined,
          cultivoId: filtroCultivoId,
          plagaId: filtroPlagaId,
        });
      }
      setRecomendaciones(data);
      await setCache('recomendaciones.list', data);
    } catch {
      const cached = await getCache<Recomendacion[]>('recomendaciones.list');
      if (cached) setRecomendaciones(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroTipo, filtroCultivoId, filtroPlagaId, showMisForos]);

  const loadSaberes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingSaberes(true);

      const data = await recomendacionesApi.getAllSaberes({
        q: searchSaberes || undefined,
        cultivoId: filtroCultivoSaber,
      });
      setSaberes(data);
      await setCache('saberes.list', data);
    } catch {
      const cached = await getCache<SaberAncestral[]>('saberes.list');
      if (cached) setSaberes(cached);
    } finally {
      setLoadingSaberes(false);
      setRefreshing(false);
    }
  }, [searchSaberes, filtroCultivoSaber]);

  const forosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return recomendaciones;
    const q = searchQuery.toLowerCase();
    return recomendaciones.filter(
      (r) =>
        r.titulo.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q),
    );
  }, [recomendaciones, searchQuery]);

  const saberesFiltrados = useMemo(() => {
    if (!searchSaberes.trim()) return saberes;
    const q = searchSaberes.toLowerCase();
    return saberes.filter(
      (s) =>
        s.titulo.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q),
    );
  }, [saberes, searchSaberes]);

  useFocusEffect(
    useCallback(() => {
      loadCatalogs();
      if (tabActivo === 'foros') loadForos();
      else loadSaberes();
    }, [tabActivo, loadForos, loadSaberes, loadCatalogs])
  );

  const switchTab = (tab: TabKey) => {
    setTabActivo(tab);
    if (tab === 'foros') loadForos();
    else loadSaberes();
  };

  // ── Renderers ──
  const renderForoItem = ({ item }: { item: Recomendacion }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('RecomendacionDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={TIPO_ICON[item.tipo] || 'chatbubble-outline'} size={22} color={TIPO_COLOR[item.tipo] || '#10b981'} />
        <View style={[styles.tipoBadge, { backgroundColor: (TIPO_COLOR[item.tipo] || '#10b981') + '20' }]}>
          <Text style={[styles.tipoText, { color: TIPO_COLOR[item.tipo] || '#10b981' }]}>
            {item.tipo === 'RECOMENDACION' ? 'Recomendación' : item.tipo === 'CONSULTA' ? 'Consulta' : 'Ancestral'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.author}>{item.usuario?.nombre || 'Anónimo'}</Text>
      </View>
      <View style={styles.tagRow}>
        {item.cultivo && (
          <Text style={styles.tag}><Ionicons name="leaf" size={12} color="#16a34a" /> {item.cultivo.nombre}</Text>
        )}
        {item.plaga && (
          <Text style={[styles.tag, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
            <Ionicons name="bug" size={12} color="#dc2626" /> {item.plaga.nombre}
          </Text>
        )}
      </View>
    </Pressable>
  );

  const renderSaberItem = ({ item }: { item: SaberAncestral }) => (
    <Pressable
      style={styles.saberCard}
      onPress={() => navigation.navigate('SaberDetail', { id: item.id })}
    >
      <View style={styles.saberCardHeader}>
        <View style={[styles.saberBadge, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="bulb-outline" size={12} color="#7c3aed" />
          <Text style={[styles.saberBadgeText, { color: '#7c3aed' }]}>SABER ANCESTRAL</Text>
        </View>
      </View>
      <Text style={styles.saberTitle} numberOfLines={2}>{item.titulo}</Text>
      <Text style={styles.saberAuthor}>{item.usuario?.nombre || 'Anónimo'}</Text>
      {item.cultivo && (
        <View style={styles.saberCultivosRow}>
          <Text style={styles.saberCultivo}><Ionicons name="leaf" size={12} color="#16a34a" /> {item.cultivo.nombre}</Text>
        </View>
      )}
      <View style={styles.saberRatingRow}>
        <Ionicons name="thumbs-up" size={14} color="#059669" />
        <Text style={styles.saberRatingText}>{item.valoracionPromedio > 0 ? item.valoracionPromedio.toFixed(1) : '0.0'}</Text>
        <Text style={styles.saberRatingCount}>({item.totalValoraciones} calificaciones)</Text>
      </View>
    </Pressable>
  );

  const renderSelect = (label: string, value: string | undefined, placeholder: string, onPress: () => void) => (
    <Pressable style={styles.selectBtn} onPress={onPress}>
      <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#94a3b8" />
    </Pressable>
  );

  // ── Render ──
  return (
    <SafeAreaView style={styles.container}>
      {/* ── Tabs: Foros / Saberes Ancestrales ── */}
      <View style={styles.mainTabRow}>
        <Pressable
          style={[styles.mainTab, tabActivo === 'foros' && styles.mainTabActive]}
          onPress={() => switchTab('foros')}
        >
          <Text style={[styles.mainTabText, tabActivo === 'foros' && styles.mainTabTextActive]}>
            FOROS
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mainTab, tabActivo === 'saberes' && styles.mainTabActive]}
          onPress={() => switchTab('saberes')}
        >
          <Text style={[styles.mainTabText, tabActivo === 'saberes' && styles.mainTabTextActive]}>
            SABERES ANCESTRALES
          </Text>
        </Pressable>
      </View>

      {/* ── TAB: FOROS ── */}
      {tabActivo === 'foros' && (
        <>
          {/* Sub-tabs: Todos / Mis Foros */}
          <View style={styles.subTabRow}>
            <Pressable
              style={[styles.subTab, !showMisForos && styles.subTabActive]}
              onPress={() => { setShowMisForos(false); setFiltroTipo(null); }}
            >
              <Text style={[styles.subTabText, !showMisForos && styles.subTabTextActive]}>Todos</Text>
            </Pressable>
            <Pressable
              style={[styles.subTab, showMisForos && styles.subTabActive]}
              onPress={() => setShowMisForos(true)}
            >
              <Ionicons name="person" size={14} color={showMisForos ? '#fff' : '#64748b'} />
              <Text style={[styles.subTabText, showMisForos && styles.subTabTextActive]}> Mis Foros</Text>
            </Pressable>
          </View>

          {/* Filters */}
          {!showMisForos && (
            <View style={styles.filtersRow}>
              {renderSelect('Tipo', (filtroTipo ? tipos.find(t => t.key === filtroTipo)?.label : null) || undefined, 'Tipo', () => setShowTipoSelect(true))}
              {renderSelect('Cultivo', (filtroCultivoId ? cultivos.find(c => c.id === filtroCultivoId)?.nombre : null) || undefined, 'Cultivo', () => setShowCultivoSelect(true))}
              {renderSelect('Plaga', (filtroPlagaId ? plagas.find(p => p.id === filtroPlagaId)?.nombre : null) || undefined, 'Plaga', () => setShowPlagaSelect(true))}
              {(filtroTipo || filtroCultivoId || filtroPlagaId) && (
                <Pressable style={styles.clearBtn} onPress={() => { setFiltroTipo(null); setFiltroCultivoId(undefined); setFiltroPlagaId(undefined); }}>
                  <Ionicons name="close" size={16} color="#ef4444" />
                </Pressable>
              )}
            </View>
          )}

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar en foros..." />
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>
          ) : (
            <FlatList
              data={forosFiltrados}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderForoItem}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadForos(true)} tintColor="#059669" />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="chatbubble-outline" size={54} color="#94a3b8" />
                  <Text style={styles.emptyText}>{showMisForos ? 'No has publicado nada aún' : 'No hay publicaciones aún'}</Text>
                  <Text style={styles.emptySubtext}>{showMisForos ? 'Crea tu primera publicación' : 'Sé el primero en compartir'}</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* ── TAB: SABERES ANCESTRALES ── */}
      {tabActivo === 'saberes' && (
        <>
          {/* Filters */}
          <View style={styles.filtersRow}>
            {renderSelect('Cultivo', (filtroCultivoSaber ? cultivos.find(c => c.id === filtroCultivoSaber)?.nombre : null) || undefined, 'Cultivo', () => setShowCultivoSaberSelect(true))}
            {filtroCultivoSaber && (
              <Pressable style={styles.clearBtn} onPress={() => setFiltroCultivoSaber(undefined)}>
                <Ionicons name="close" size={16} color="#ef4444" />
              </Pressable>
            )}
          </View>

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <SearchBar value={searchSaberes} onChangeText={setSearchSaberes} placeholder="Buscar saberes ancestrales..." />
          </View>

          {/* List */}
          {loadingSaberes ? (
            <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
          ) : (
            <FlatList
              data={saberesFiltrados}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderSaberItem}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSaberes(true)} tintColor="#7c3aed" />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="leaf-outline" size={54} color="#94a3b8" />
                  <Text style={styles.emptyText}>No hay saberes ancestrales aún</Text>
                  <Text style={styles.emptySubtext}>Los comentarios validados por moderadores aparecerán aquí</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* FAB - only for foros tab */}
      {tabActivo === 'foros' && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('RecomendacionForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* ── Modals ── */}
      <ModalSelect visible={showTipoSelect} title="Filtrar por tipo" onClose={() => setShowTipoSelect(false)}>
        <Pressable style={[styles.modalItem, !filtroTipo && styles.modalItemActive]} onPress={() => { setFiltroTipo(null); setShowTipoSelect(false); }}>
          <Ionicons name="apps" size={20} color={!filtroTipo ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modalItemText, !filtroTipo && styles.modalItemTextActive]}>Todos</Text>
        </Pressable>
        {tipos.map((t) => (
          <Pressable key={t.key} style={[styles.modalItem, filtroTipo === t.key && styles.modalItemActive]} onPress={() => { setFiltroTipo(filtroTipo === t.key ? null : t.key); setShowTipoSelect(false); }}>
            <Ionicons name={t.icon as any} size={20} color={filtroTipo === t.key ? '#fff' : t.color} />
            <Text style={[styles.modalItemText, filtroTipo === t.key && styles.modalItemTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ModalSelect>

      <ModalSelect visible={showCultivoSelect} title="Filtrar por cultivo" onClose={() => setShowCultivoSelect(false)}>
        <Pressable style={[styles.modalItem, !filtroCultivoId && styles.modalItemActive]} onPress={() => { setFiltroCultivoId(undefined); setShowCultivoSelect(false); }}>
          <Ionicons name="apps" size={20} color={!filtroCultivoId ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modalItemText, !filtroCultivoId && styles.modalItemTextActive]}>Todos</Text>
        </Pressable>
        <ScrollView style={styles.modalList}>
          {cultivos.map((c) => (
            <Pressable key={c.id} style={[styles.modalItem, filtroCultivoId === c.id && styles.modalItemActive]} onPress={() => { setFiltroCultivoId(c.id); setShowCultivoSelect(false); }}>
              <Ionicons name="leaf" size={20} color={filtroCultivoId === c.id ? '#fff' : '#16a34a'} />
              <Text style={[styles.modalItemText, filtroCultivoId === c.id && styles.modalItemTextActive]}>{c.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ModalSelect>

      <ModalSelect visible={showPlagaSelect} title="Filtrar por plaga" onClose={() => setShowPlagaSelect(false)}>
        <Pressable style={[styles.modalItem, !filtroPlagaId && styles.modalItemActive]} onPress={() => { setFiltroPlagaId(undefined); setShowPlagaSelect(false); }}>
          <Ionicons name="apps" size={20} color={!filtroPlagaId ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modalItemText, !filtroPlagaId && styles.modalItemTextActive]}>Todas</Text>
        </Pressable>
        <ScrollView style={styles.modalList}>
          {plagas.map((p) => (
            <Pressable key={p.id} style={[styles.modalItem, filtroPlagaId === p.id && styles.modalItemActive]} onPress={() => { setFiltroPlagaId(p.id); setShowPlagaSelect(false); }}>
              <Ionicons name="bug" size={20} color={filtroPlagaId === p.id ? '#fff' : '#dc2626'} />
              <Text style={[styles.modalItemText, filtroPlagaId === p.id && styles.modalItemTextActive]}>{p.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ModalSelect>

      <ModalSelect visible={showCultivoSaberSelect} title="Filtrar por cultivo" onClose={() => setShowCultivoSaberSelect(false)}>
        <Pressable style={[styles.modalItem, !filtroCultivoSaber && styles.modalItemActive]} onPress={() => { setFiltroCultivoSaber(undefined); setShowCultivoSaberSelect(false); }}>
          <Ionicons name="apps" size={20} color={!filtroCultivoSaber ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modalItemText, !filtroCultivoSaber && styles.modalItemTextActive]}>Todos</Text>
        </Pressable>
        <ScrollView style={styles.modalList}>
          {cultivos.map((c) => (
            <Pressable key={c.id} style={[styles.modalItem, filtroCultivoSaber === c.id && styles.modalItemActive]} onPress={() => { setFiltroCultivoSaber(c.id); setShowCultivoSaberSelect(false); }}>
              <Ionicons name="leaf" size={20} color={filtroCultivoSaber === c.id ? '#fff' : '#16a34a'} />
              <Text style={[styles.modalItemText, filtroCultivoSaber === c.id && styles.modalItemTextActive]}>{c.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ModalSelect>
    </SafeAreaView>
  );
}

// Helper modal component
function ModalSelect({ visible, title, children, onClose }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Main tabs
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomColor: '#059669',
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  mainTabTextActive: {
    color: '#059669',
  },

  // Sub tabs
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
    gap: 8,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  subTabActive: { backgroundColor: '#059669' },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  subTabTextActive: { color: '#fff' },

  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    minWidth: 90,
  },
  selectText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  selectPlaceholder: { color: '#94a3b8' },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 16, maxHeight: '50%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  modalList: { maxHeight: 200 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  modalItemActive: { backgroundColor: '#059669' },
  modalItemText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  modalItemTextActive: { color: '#fff' },

  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipoBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  tipoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12, color: '#94a3b8' },
  tagRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
  tag: { fontSize: 11, color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 },

  searchWrapper: { paddingTop: 8 },

  // Saber card
  saberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  saberCardHeader: { marginBottom: 8 },
  saberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  saberBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  saberTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  saberAuthor: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  saberCultivosRow: { flexDirection: 'row', marginBottom: 8 },
  saberCultivo: { fontSize: 11, color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  saberRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saberRatingText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  saberRatingCount: { fontSize: 11, color: '#94a3b8' },
});
