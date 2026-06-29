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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { getAlertas, marcarAlertaLeida, getNotificaciones } from '../../../infrastructure/data/alertas/alertasApi';
import type { Alerta } from '../../../domain/alertas/types';

const NIVEL_COLORS: Record<string, string> = {
  BAJO: '#10b981',
  MEDIO: '#f59e0b',
  ALTO: '#f97316',
  CRITICO: '#ef4444',
};

const NIVEL_LABELS: Record<string, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

function AnimatedCard({ item, onPress }: { item: Alerta; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const nivelColor = NIVEL_COLORS[item.nivel] || '#6b7280';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }, !item.leida && styles.cardUnread]}>
        <View style={styles.cardTop}>
          <View style={[styles.nivelBadge, { backgroundColor: nivelColor + '18' }]}>
            <View style={[styles.nivelDot, { backgroundColor: nivelColor }]} />
            <Text style={[styles.nivelText, { color: nivelColor }]}>{NIVEL_LABELS[item.nivel] || item.nivel}</Text>
          </View>
          <View style={styles.cardTopRight}>
            {!item.leida && <View style={styles.unreadDot} />}
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.descripcion}</Text>

        <View style={styles.metadataRow}>
          <View style={styles.chip}>
            <Ionicons name="document-text" size={12} color="#64748b" />
            <Text style={styles.chipText}> {item.totalReportes} reportes</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function AlertasScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);
  const [items, setItems] = useState<Alerta[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const [alertas] = await Promise.all([
        getAlertas(),
      ]);
      setItems(alertas);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNotifCount = async () => {
    if (!usuario) return;
    try {
      const notifs = await getNotificaciones(usuario.id);
      setNotifCount(notifs.filter((n) => !n.leida).length);
    } catch {}
  };

  useEffect(() => {
    loadData();
    loadNotifCount();
  }, []);

  const handlePress = async (item: Alerta) => {
    if (!item.leida) {
      try {
        await marcarAlertaLeida(item.id);
        setItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, leida: true } : a)));
      } catch {}
    }
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shield-checkmark" size={54} color="#10b981" />
        <Text style={styles.emptyTitle}>Sin alertas</Text>
        <Text style={styles.emptyText}>No hay brotes detectados en tu zona</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Alertas</Text>
            <Text style={styles.headerSubtitle}>
              {items.length === 1 ? '1 alerta' : `${items.length} alertas`}
            </Text>
          </View>
          <Pressable
            style={styles.notifButton}
            onPress={() => navigation.navigate('Notificaciones')}
          >
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notifCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando alertas...</Text>
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
            <AnimatedCard item={item} onPress={() => handlePress(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  notifButton: {
    position: 'relative',
    padding: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  cardUnread: {
    borderColor: '#3b82f6',
    borderWidth: 1.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nivelDot: { width: 6, height: 6, borderRadius: 3 },
  nivelText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
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
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
