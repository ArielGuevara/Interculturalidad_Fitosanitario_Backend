import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import {
  getNotificaciones,
  marcarNotificacionLeida,
} from '../../../infrastructure/data/alertas/alertasApi';
import type { Notificacion } from '../../../domain/alertas/types';

const PAGE_SIZE = 6;

// ── Notificación Card ──
function NotificacionCard({ item, onPress }: { item: Notificacion; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const iconName = !item.leida ? 'notifications' : 'notifications-outline';
  const iconColor = !item.leida ? '#3b82f6' : '#94a3b8';
  const bgColor = !item.leida ? '#dbeafe' : '#f1f5f9';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.cardNotif, { transform: [{ scale }] }, !item.leida && styles.notifUnread]}>
        <View style={styles.cardRow}>
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={iconName as any} size={20} color={iconColor} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.notifTitle, !item.leida && styles.notifTitleUnread]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.cardBody} numberOfLines={2}>{item.cuerpo}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Detail Modal ──
function NotificacionDetailModal({
  visible,
  notificacion,
  onClose,
}: {
  visible: boolean;
  notificacion: Notificacion | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Ionicons name="notifications" size={24} color="#3b82f6" />
            <Text style={styles.modalTitle}>{notificacion?.titulo || ''}</Text>
          </View>
          <Text style={styles.modalBody}>{notificacion?.cuerpo || ''}</Text>
          <View style={styles.modalFooter}>
            <Text style={styles.modalDate}>
              {notificacion?.createdAt ? new Date(notificacion.createdAt).toLocaleString() : ''}
            </Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function NotificacionesScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);

  const [todas, setTodas] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailNotif, setDetailNotif] = useState<Notificacion | null>(null);
  const [page, setPage] = useState(1);

  const displayed = todas.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < todas.length;

  const loadNotificaciones = useCallback(async (isRefreshing = false) => {
    if (!usuario) return;
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await getNotificaciones(usuario.id);
      setTodas(data);
      setPage(1);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  }, [usuario]);

  useEffect(() => {
    loadNotificaciones();
  }, [loadNotificaciones]);

  const onRefresh = () => {
    loadNotificaciones(true);
  };

  const handleNotifPress = async (item: Notificacion) => {
    if (!item.leida) {
      try {
        await marcarNotificacionLeida(item.id);
        setTodas((prev) => prev.map((n) => (n.id === item.id ? { ...n, leida: true } : n)));
      } catch {}
    }

    const tipo = item.tipo || item.data?.type;

    if (tipo === 'volver_a_reportar' || tipo === 'rechazado' && item.data?.reporteId) {
      navigation.navigate('ReporteDetail', { id: item.data!.reporteId });
    } else if (tipo === 'tratamiento_asignado' || tipo === 'cambio_estado' && item.data?.reporteId) {
      navigation.navigate('ReporteDetail', { id: item.data!.reporteId });
    } else if (tipo === 'nuevo_comentario' && item.data?.recomendacionId) {
      navigation.navigate('RecomendacionDetail', { id: item.data!.recomendacionId });
    } else if (item.data?.reporteId) {
      navigation.navigate('ReporteDetail', { id: item.data.reporteId });
    } else {
      setDetailNotif(item);
    }
  };

  const renderItem = ({ item }: { item: Notificacion }) => (
    <NotificacionCard item={item} onPress={() => handleNotifPress(item)} />
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    const remaining = todas.length - displayed.length;
    return (
      <Pressable style={styles.verMasBtn} onPress={() => setPage((p) => p + 1)}>
        <Text style={styles.verMasText}>Ver más ({remaining} restantes)</Text>
        <Ionicons name="chevron-down" size={18} color="#15803d" />
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={54} color="#94a3b8" />
      <Text style={styles.emptyTitle}>Sin notificaciones</Text>
      <Text style={styles.emptyText}>No tienes notificaciones nuevas</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <Text style={styles.headerSubtitle}>
          {todas.length} notificación{todas.length === 1 ? '' : 'es'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(i) => `n-${i.id}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
          renderItem={renderItem}
        />
      )}

      <NotificacionDetailModal
        visible={detailNotif !== null}
        notificacion={detailNotif}
        onClose={() => setDetailNotif(null)}
      />
    </SafeAreaView>
  );
}

export default NotificacionesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
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
    paddingBottom: 100,
    paddingTop: 4,
  },

  // Notificacion card
  cardNotif: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notifUnread: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f0f7ff',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cardBody: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  dateText: { fontSize: 12, color: '#94a3b8' },

  verMasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verMasText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  modalBody: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalCloseBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalCloseText: {
    fontWeight: '700',
    color: '#475569',
  },
});
