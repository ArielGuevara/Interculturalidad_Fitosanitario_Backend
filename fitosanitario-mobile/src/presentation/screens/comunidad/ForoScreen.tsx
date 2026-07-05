import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import type { Recomendacion } from '../../../domain/recomendaciones/types';

const TIPO_ICON = {
  RECOMENDACION: 'bulb-outline' as const,
  CONSULTA: 'help-circle-outline' as const,
  CONOCIMIENTO_ANCESTRAL: 'leaf-outline' as const,
};

const TIPO_COLOR: Record<string, string> = {
  RECOMENDACION: '#059669',
  CONSULTA: '#d97706',
  CONOCIMIENTO_ANCESTRAL: '#7c3aed',
};

export function ForoScreen() {
  const navigation = useNavigation<any>();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await recomendacionesApi.getAll(filtroTipo ? { tipo: filtroTipo } : undefined);
      setRecomendaciones(data);
    } catch (e) {
      console.error('Error cargando foro:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroTipo]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const tipos = [
    { key: null, label: 'Todos' },
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

      {item.cultivo && (
        <View style={styles.tagRow}>
          <Text style={styles.tag}><Ionicons name="leaf" size={12} color="#16a34a" /> {item.cultivo.nombre}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.filterRow}>
        {tipos.map((t) => (
          <Pressable
            key={t.key || 'todos'}
            style={[styles.filterChip, filtroTipo === t.key && styles.filterChipActive]}
            onPress={() => setFiltroTipo(t.key)}
          >
            <Text style={[styles.filterText, filtroTipo === t.key && styles.filterTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

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
              <Text style={styles.emptyText}>No hay publicaciones aún</Text>
              <Text style={styles.emptySubtext}>Sé el primero en compartir tu conocimiento</Text>
            </View>
          }
        />
      )}

      {/* FAB para nueva recomendación */}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#059669',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
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
  tipoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tipoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: { fontSize: 12, color: '#94a3b8' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  ratingCount: { fontSize: 11, color: '#94a3b8' },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    fontSize: 11,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
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
