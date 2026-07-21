import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { syncPendingReportes } from '../../../infrastructure/offline/sync';
import { listPendingReportes } from '../../../infrastructure/offline/pendingReportes';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { fetchReportes } from '../../../infrastructure/data/reportes/reportesApi';
import { Ionicons } from '@expo/vector-icons';
import { AccessibleButton } from '../../../shared/components/AccessibleButton';
import { useAccessibilityStore } from '../../../shared/stores/accessibilityStore';

const { width: W } = Dimensions.get('window');
const CARD_GAP = 12;
const BODY_PADDING = 20;
const GRID_CARD_WIDTH = (W - BODY_PADDING * 2 - CARD_GAP) / 2;

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

interface FeatureItem {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);
  const easyMode = useAccessibilityStore((s) => s.easyMode);
  const [comunidadCount, setComunidadCount] = useState(0);
  const [reporteCount, setReporteCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recomendaciones, reportes, pendings] = await Promise.all([
          recomendacionesApi.getAll(),
          fetchReportes(),
          listPendingReportes(),
        ]);
        setComunidadCount(recomendaciones.length);
        setReporteCount(reportes.length);
        setPendingCount(pendings.length);
      } catch {}
    };
    loadData();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const onSync = async () => {
    try {
      const result = await syncPendingReportes();
      Alert.alert('Sincronización', `Enviados: ${result.synced}\nFallidos: ${result.failed}`);
      const pendings = await listPendingReportes();
      setPendingCount(pendings.length);
    } catch {
      Alert.alert('Error', 'Hubo un problema al sincronizar los datos.');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(usuario?.nombre);
  const firstName = usuario?.nombre ? usuario.nombre.trim().split(/\s+/)[0] : '';

  const features: FeatureItem[] = [
    {
      icon: 'bug-outline',
      label: 'Plagas',
      color: '#DEA55A',
      onPress: () => navigation.navigate('Plagas'),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Foro',
      color: '#F8E8C0',
      onPress: () => navigation.navigate('ForoList'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notificaciones',
      color: '#CC7358',
      onPress: () => navigation.navigate('Notificaciones'),
    },
    {
      icon: 'cloud-outline',
      label: 'Sincronizar',
      color: '#7FAA8F',
      onPress: onSync,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#276749" translucent />

      <View style={styles.header}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Hola{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.subtitle}>Campo Inteligente</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {easyMode ? (
            <>
              <AccessibleButton
                icon="clipboard-outline"
                label="Nuevo reporte"
                onPress={() => navigation.navigate('CreateReporte')}
                color="#7DD3FC"
                textColor="#143A22"
                style={{ marginBottom: 12 }}
              />
              <AccessibleButton
                icon="cloud-upload-outline"
                label="Subir pendientes"
                onPress={onSync}
                color="#2D6A4F"
                style={{ marginBottom: 20 }}
              />
              <AccessibleButton
                icon="bug"
                label="Plagas"
                onPress={() => navigation.navigate('Plagas')}
                color="#DEA55A"
                style={{ marginBottom: 12 }}
              />
              <AccessibleButton
                icon="chatbubbles"
                label={`Foro (${comunidadCount})`}
                onPress={() => navigation.navigate('ForoList')}
                color="#F8E8C0"
                textColor="#143A22"
                style={{ marginBottom: 12 }}
              />
              <AccessibleButton
                icon="notifications"
                label="Notificaciones"
                onPress={() => navigation.navigate('Notificaciones')}
                color="#CC7358"
                style={{ marginBottom: 12 }}
              />
              <AccessibleButton
                icon="cloud"
                label="Sincronizar"
                onPress={onSync}
                color="#7FAA8F"
              />
            </>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#d1fae5' }]}>
                    <Ionicons name="document-text-outline" size={18} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>{reporteCount}</Text>
                  <Text style={styles.statLabel}>Reportes</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#ede9fe' }]}>
                    <Ionicons name="chatbubbles-outline" size={18} color="#8b5cf6" />
                  </View>
                  <Text style={styles.statValue}>{comunidadCount}</Text>
                  <Text style={styles.statLabel}>Foro</Text>
                </View>
                <Pressable style={styles.statCard} onPress={onSync}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="cloud-outline" size={18} color="#f59e0b" />
                  </View>
                  <Text style={styles.statValue}>{pendingCount}</Text>
                  <Text style={styles.statLabel}>Pendientes</Text>
                  {pendingCount > 0 && <View style={styles.statDot} />}
                </Pressable>
              </View>

              <Pressable
                style={styles.ctaButton}
                onPress={() => navigation.navigate('CreateReporte')}
              >
                <View style={styles.ctaShine} />
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="camera-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.ctaText}>Nuevo Reporte</Text>
                <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>

              <Text style={styles.sectionLabel}>ACCIONES RÁPIDAS</Text>

              <View style={styles.grid}>
                {features.map((f, idx) => {
                  const isForo = f.color === '#FAEDCD';
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.gridCard, { backgroundColor: f.color, width: GRID_CARD_WIDTH }]}
                      onPress={f.onPress}
                    >
                      <Ionicons name={f.icon as any} size={28} color={isForo ? '#143A22' : '#fff'} />
                      <Text style={[styles.gridLabel, isForo && { color: '#143A22' }]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0faf2' },

  header: {
    backgroundColor: '#276749',
    paddingTop: STATUSBAR_HEIGHT + 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute', width: W * 0.65, height: W * 0.65, borderRadius: W,
    backgroundColor: '#38A169', opacity: 0.5, top: -W * 0.3, right: -W * 0.15,
  },
  blobB: {
    position: 'absolute', width: W * 0.4, height: W * 0.4, borderRadius: W,
    backgroundColor: '#48BB78', opacity: 0.35, bottom: -W * 0.1, left: -W * 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#38A169',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  body: { flex: 1 },
  bodyContent: { padding: BODY_PADDING },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },

  ctaButton: {
    backgroundColor: '#15803d',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#14532d',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ctaText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  gridCard: {
    borderRadius: 20,
    padding: BODY_PADDING,
    paddingTop: 24,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
});
