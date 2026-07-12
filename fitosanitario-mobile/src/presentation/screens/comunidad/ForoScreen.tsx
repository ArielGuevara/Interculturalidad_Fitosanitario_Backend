import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
  RefreshControl, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import type { Recomendacion } from '../../../domain/recomendaciones/types';
import type { Cultivo, Plaga } from '../../../domain/catalogos/types';

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

const TIPO_CHIP_BG: Record<string, string> = {
  RECOMENDACION: '#d1fae5',
  CONSULTA: '#fef3c7',
  CONOCIMIENTO_ANCESTRAL: '#ede9fe',
};

const TIPO_LABEL: Record<string, string> = {
  RECOMENDACION: 'Recomendaciones',
  CONSULTA: 'Consultas',
  CONOCIMIENTO_ANCESTRAL: 'Ancestral',
};

export function ForoScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroCultivoId, setFiltroCultivoId] = useState<number | undefined>();
  const [filtroPlagaId, setFiltroPlagaId] = useState<number | undefined>();
  const [showMisForos, setShowMisForos] = useState(false);

  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [plagas, setPlagas] = useState<Plaga[]>([]);

  const loadCatalogs = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([getCultivos(), getPlagas()]);
      setCultivos(c);
      setPlagas(p);
    } catch {}
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
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
    } catch (e) {
      console.error('Error cargando foro:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroTipo, filtroCultivoId, filtroPlagaId, showMisForos]);

  useFocusEffect(
    useCallback(() => {
      loadCatalogs();
      loadData();
    }, [loadData, loadCatalogs])
  );

  const tipos = [
    { key: 'RECOMENDACION', label: 'Recomendaciones' },
    { key: 'CONSULTA', label: 'Consultas' },
    { key: 'CONOCIMIENTO_ANCESTRAL', label: 'Ancestral' },
  ];

  const renderItem = ({ item }: { item: Recomendacion }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('RecomendacionDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={TIPO_ICON[item.tipo] || 'chatbubble-outline'} size={22} color="#10b981" />
        <View style={[styles.tipoBadge, { backgroundColor: TIPO_COLOR[item.tipo] + '20' }]}>
          <Text style={[styles.tipoText, { color: TIPO_COLOR[item.tipo] }]}>
            {item.tipo === 'CONOCIMIENTO_ANCESTRAL' ? 'ANCESTRAL' : item.tipo}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.author}>{item.usuario?.nombre || 'Anónimo'}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name={item.valoracionPromedio > 0 ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
          <Text style={styles.ratingValue}>
            {item.valoracionPromedio > 0 ? item.valoracionPromedio.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.ratingCount}>({item.totalValoraciones})</Text>
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Row 1 - Main tabs: Todos | Mis Foros */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, !showMisForos && styles.tabActive]}
          onPress={() => { setShowMisForos(false); setFiltroTipo(null); }}
        >
          <Text style={[styles.tabText, !showMisForos && styles.tabTextActive]}>Todos</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, showMisForos && styles.tabActive]}
          onPress={() => setShowMisForos(true)}
        >
          <Ionicons name="person" size={14} color={showMisForos ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, showMisForos && styles.tabTextActive]}> Mis Foros</Text>
        </Pressable>
      </View>

      {!showMisForos && (
        <View style={styles.filtersContainer}>
          {/* Row 2 - Tipo filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipoRow}>
            {tipos.map((t) => {
              const active = filtroTipo === t.key;
              const chipColor = TIPO_COLOR[t.key];
              const chipBg = TIPO_CHIP_BG[t.key];
              return (
                <Pressable
                  key={t.key}
                  style={[
                    styles.tipoChip,
                    { backgroundColor: active ? chipColor : chipBg, borderColor: chipColor },
                  ]}
                  onPress={() => setFiltroTipo(filtroTipo === t.key ? null : t.key)}
                >
                  <Ionicons
                    name={TIPO_ICON[t.key]}
                    size={14}
                    color={active ? '#fff' : chipColor}
                  />
                  <Text style={[styles.tipoChipText, { color: active ? '#fff' : chipColor }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Row 3 - Cultivo filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cultivoRow}>
            <Pressable
              style={[styles.cultivoChip, !filtroCultivoId && styles.cultivoChipActive]}
              onPress={() => setFiltroCultivoId(undefined)}
            >
              <Text style={[styles.cultivoChipText, !filtroCultivoId && styles.cultivoChipTextActive]}>
                Todos
              </Text>
            </Pressable>
            {cultivos.map((c) => {
              const active = filtroCultivoId === c.id;
              return (
                <Pressable
                  key={`c-${c.id}`}
                  style={[styles.cultivoChip, active && styles.cultivoChipActive]}
                  onPress={() => setFiltroCultivoId(active ? undefined : c.id)}
                >
                  <Ionicons name="leaf" size={14} color={active ? '#fff' : '#16a34a'} />
                  <Text style={[styles.cultivoChipText, active && styles.cultivoChipTextActive]}>
                    {c.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Row 4 - Plaga filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plagaRow}>
            <Pressable
              style={[styles.plagaChip, !filtroPlagaId && styles.plagaChipActive]}
              onPress={() => setFiltroPlagaId(undefined)}
            >
              <Text style={[styles.plagaChipText, !filtroPlagaId && styles.plagaChipTextActive]}>
                Ninguna
              </Text>
            </Pressable>
            {plagas.map((p) => {
              const active = filtroPlagaId === p.id;
              return (
                <Pressable
                  key={`p-${p.id}`}
                  style={[styles.plagaChip, active && styles.plagaChipActive]}
                  onPress={() => setFiltroPlagaId(active ? undefined : p.id)}
                >
                  <Ionicons name="bug" size={14} color={active ? '#fff' : '#dc2626'} />
                  <Text style={[styles.plagaChipText, active && styles.plagaChipTextActive]}>
                    {p.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={recomendaciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={54} color="#94a3b8" />
              <Text style={styles.emptyText}>
                {showMisForos ? 'No has publicado nada aún' : 'No hay publicaciones aún'}
              </Text>
              <Text style={styles.emptySubtext}>
                {showMisForos ? 'Crea tu primera publicación en el foro' : 'Sé el primero en compartir tu conocimiento'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('RecomendacionForm', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Row 1 - Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  filtersContainer: { backgroundColor: '#fff', paddingBottom: 4 },

  // Row 2 - Tipo chips
  tipoRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  tipoChipText: { fontSize: 12, fontWeight: '600' },

  // Row 3 - Cultivo chips
  cultivoRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  cultivoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#fff',
  },
  cultivoChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  cultivoChipText: { fontSize: 12, fontWeight: '500', color: '#16a34a' },
  cultivoChipTextActive: { color: '#fff' },

  // Row 4 - Plaga chips
  plagaRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  plagaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#fff',
  },
  plagaChipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  plagaChipText: { fontSize: 12, fontWeight: '500', color: '#dc2626' },
  plagaChipTextActive: { color: '#fff' },

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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipoBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  tipoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12, color: '#94a3b8' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  ratingCount: { fontSize: 11, color: '#94a3b8' },
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
});
