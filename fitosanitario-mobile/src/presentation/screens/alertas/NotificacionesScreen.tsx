import React, { useState, useRef, useCallback } from 'react';
import {
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { getNotificaciones, marcarNotificacionLeida } from '../../../infrastructure/data/alertas/alertasApi';
import type { Notificacion } from '../../../domain/alertas/types';

function AnimatedCard({ item, onPress }: { item: Notificacion; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }, !item.leida && styles.cardUnread]}>
        <View style={styles.cardRow}>
          <View style={[styles.iconContainer, !item.leida && styles.iconContainerUnread]}>
            <Ionicons
              name={item.leida ? 'notifications-outline' : 'notifications'}
              size={20}
              color={item.leida ? '#94a3b8' : '#3b82f6'}
            />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, !item.leida && styles.cardTitleUnread]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.cardBody} numberOfLines={2}>{item.cuerpo}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function NotificacionesScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (!usuario) return;
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await getNotificaciones(usuario.id);
      setItems(data);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePress = async (item: Notificacion) => {
    if (!item.leida) {
      try {
        await marcarNotificacionLeida(item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, leida: true } : n)));
      } catch {}
    }
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={54} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Sin notificaciones</Text>
        <Text style={styles.emptyText}>No tienes notificaciones nuevas</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <Text style={styles.headerSubtitle}>
          {items.length === 0 ? 'Sin notificaciones' : `${items.length} notificación${items.length === 1 ? '' : 'es'}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#3b82f6" colors={['#3b82f6']} />
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
  card: {
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
  cardUnread: {
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerUnread: {
    backgroundColor: '#dbeafe',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
  cardBody: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
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
