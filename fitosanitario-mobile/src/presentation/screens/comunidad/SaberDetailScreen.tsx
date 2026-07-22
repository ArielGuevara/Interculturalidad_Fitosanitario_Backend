import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  Pressable, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import type { SaberAncestral } from '../../../domain/recomendaciones/types';

type Props = NativeStackScreenProps<AppStackParamList, 'SaberDetail'>;

export function SaberDetailScreen({ route }: Props) {
  const { id } = route.params;
  const usuario = useAuthStore((s) => s.usuario);

  const [saber, setSaber] = useState<SaberAncestral | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await recomendacionesApi.getById(id) as any;
      setSaber(data);
      const miVal = await recomendacionesApi.getMiValoracion(id);
      setUserRating(miVal.puntuacion);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el saber ancestral');
    } finally {
      setLoading(false);
    }
  };

  const handleValorar = async (puntuacion: number) => {
    if (!saber) return;
    try {
      const res: any = await recomendacionesApi.valorar(saber.id, puntuacion);
      setUserRating(res.miValoracion);
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo valorar');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!saber) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#64748b' }}>Saber ancestral no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="bulb-outline" size={14} color="#7c3aed" />
          <Text style={[styles.badgeText, { color: '#7c3aed' }]}>SABER ANCESTRAL</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{saber.titulo}</Text>

      {/* Author */}
      <View style={styles.authorRow}>
        <Ionicons name="person-circle-outline" size={18} color="#94a3b8" />
        <Text style={styles.author}>{saber.usuario?.nombre || 'Anónimo'}</Text>
      </View>

      {/* Cultivo / Plaga chips */}
      <View style={styles.tagsRow}>
        {saber.cultivo && (
          <Text style={styles.tag}><Ionicons name="leaf" size={12} color="#16a34a" /> {saber.cultivo.nombre}</Text>
        )}
        {saber.plaga && (
          <Text style={[styles.tag, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
            <Ionicons name="bug" size={12} color="#dc2626" /> {saber.plaga.nombre}
          </Text>
        )}
      </View>

      {/* Comment card */}
      <View style={styles.commentCard}>
        <Text style={styles.commentLabel}>COMENTARIO DEL AGRICULTOR</Text>
        <Text style={styles.commentText}>{saber.solucion || saber.descripcion}</Text>
      </View>

      {/* Moderator comment */}
      {saber.comentarioModerador && (
        <View style={styles.modCard}>
          <View style={styles.modHeader}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.modLabel}>COMENTARIO DEL MODERADOR</Text>
          </View>
          <Text style={styles.modText}>{saber.comentarioModerador}</Text>
        </View>
      )}

      {/* Rating section */}
      <View style={styles.ratingSection}>
        <Text style={styles.rateQuestion}>¿Te fue útil este saber ancestral?</Text>
        <View style={styles.ratingRow}>
          <Pressable
            style={[styles.thumbBtn, userRating === 5 && styles.thumbBtnActiveGreen]}
            onPress={() => handleValorar(5)}
          >
            <Ionicons
              name={userRating === 5 ? 'thumbs-up' : 'thumbs-up-outline'}
              size={28}
              color={userRating === 5 ? '#fff' : '#16a34a'}
            />
            <Text style={[styles.thumbLabel, userRating === 5 && { color: '#fff' }]}>Útil</Text>
          </Pressable>
          <Pressable
            style={[styles.thumbBtn, userRating === 1 && styles.thumbBtnActiveRed]}
            onPress={() => handleValorar(1)}
          >
            <Ionicons
              name={userRating === 1 ? 'thumbs-down' : 'thumbs-down-outline'}
              size={28}
              color={userRating === 1 ? '#fff' : '#dc2626'}
            />
            <Text style={[styles.thumbLabel, userRating === 1 && { color: '#fff' }]}>No útil</Text>
          </Pressable>
        </View>
        <Text style={styles.ratingCount}>
          {saber.totalValoraciones} calificación(es) · Promedio: {saber.valoracionPromedio.toFixed(1)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  badgeRow: { marginBottom: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  author: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tag: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
    fontWeight: '500',
  },
  modCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 24,
  },
  modHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  modText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    fontWeight: '500',
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rateQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  thumbBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  thumbBtnActiveGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  thumbBtnActiveRed: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  thumbLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
