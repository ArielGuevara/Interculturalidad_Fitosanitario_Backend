import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { syncPendingReportes } from '../../../infrastructure/offline/sync';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');

// ── Tipos ────────────────────────────────────────────────────────────────────
interface AnimatedPressableProps {
  style?: any;
  onPress?: () => void;
  children: React.ReactNode;
}

interface QuickCardProps {
  iconName: string;
  label: string;
  color: string;
  onPress: () => void;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const usuario = useAuthStore((s) => s.usuario);
  const [comunidadCount, setComunidadCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadCount = async () => {
      try {
        const data = await recomendacionesApi.getAll();
        setComunidadCount(data.length);
      } catch {}
    };
    loadCount();
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
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al sincronizar los datos.');
    }
  };

  // Función robusta para extraer iniciales sin importar los espacios
  const getInitials = (name?: string) => {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(usuario?.nombre);
  const firstName = usuario?.nombre ? usuario.nombre.trim().split(/\s+/)[0] : '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a2412" translucent={true} />
      
      {/* ── Dark green header ── */}
      <View style={styles.header}>
        {/* Decorative blobs */}
        <View style={styles.blobA} />
        <View style={styles.blobB} />

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              Hola{firstName ? `, ${firstName}` : ''}
            </Text>
          
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Primary CTA */}
          <AnimatedPressable
            style={styles.ctaCard}
            onPress={() => navigation.navigate('CreateReporte')}
          >
            <View style={styles.ctaShine} />
            <View style={styles.ctaIconWrap}>
              <Ionicons name="clipboard-outline" size={24} color="#fff" />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Crear reporte</Text>
              <Text style={styles.ctaSub}>Documenta un hallazgo en campo</Text>
            </View>
            <Text style={styles.ctaArrow}>→</Text>
          </AnimatedPressable>

          {/* Sync */}
          <AnimatedPressable style={styles.syncCard} onPress={onSync}>
            <Ionicons name="cloud-upload-outline" size={18} color="#10b981" style={{ marginRight: 12 }} />
            <Text style={styles.syncText}>Sincronizar pendientes</Text>
            <Text style={styles.syncArrow}>↑</Text>
          </AnimatedPressable>

          {/* Quick access */}
          <Text style={styles.sectionLabel}>CATÁLOGOS</Text>
          <View style={styles.quickGrid}>
            <QuickCard
              iconName="leaf"
              label="Cultivos"
              color="#14532d"
              onPress={() => navigation.navigate('Cultivos')}
            />
            <QuickCard
              iconName="bug"
              label="Plagas"
              color="#7f1d1d"
              onPress={() => navigation.navigate('Plagas')}
            />
          </View>
          <QuickCardWide
            iconName="medkit"
            label="Productos"
            color="#1e3a5f"
            onPress={() => navigation.navigate('Productos')}
          />

          <QuickCardWide
            iconName="notifications"
            label="Alertas"
            color="#b45309"
            onPress={() => navigation.navigate('Alertas')}
          />

          <QuickCardWide
            iconName="chatbubbles"
            label={`Foro Comunitario (${comunidadCount})`}
            color="#7c3aed"
            onPress={() => navigation.navigate('ForoList')}
          />

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Reusable animated pressable ───────────────────────────────────────────────
function AnimatedPressable({ style, onPress, children }: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Quick card (half width) ───────────────────────────────────────────────────
function QuickCard({ iconName, label, color, onPress }: QuickCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={styles.quickCard}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.quickCardInner, { backgroundColor: color, transform: [{ scale }] }]}>
        <Ionicons name={iconName as any} size={28} color="#fff" />
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickArrow}>→</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Quick card (full width) ───────────────────────────────────────────────────
function QuickCardWide({ iconName, label, color, onPress }: QuickCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.quickCardWide, { backgroundColor: color, transform: [{ scale }] }]}>
        <Ionicons name={iconName as any} size={28} color="#fff" />
        <Text style={[styles.quickLabel, { fontSize: 15 }]}>{label}</Text>
        <Text style={[styles.quickArrow, { marginLeft: 'auto' }]}>→</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0faf2' },

  // Header
  header: {
    backgroundColor: '#0a2412',
    paddingTop: STATUSBAR_HEIGHT + 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute', width: W * 0.65, height: W * 0.65, borderRadius: W,
    backgroundColor: '#14532d', opacity: 0.5, top: -W * 0.3, right: -W * 0.15,
  },
  blobB: {
    position: 'absolute', width: W * 0.4, height: W * 0.4, borderRadius: W,
    backgroundColor: '#166534', opacity: 0.35, bottom: -W * 0.1, left: -W * 0.1,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#15803d',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#94a3b8',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 16,
  },

  // CTA card
  ctaCard: {
    backgroundColor: '#15803d',
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#14532d', shadowOpacity: 0.4,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ctaShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  ctaIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  ctaArrow: { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },

  // Sync card
  syncCard: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#d1fae5',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  syncText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a4731' },
  syncArrow: { fontSize: 18, color: '#10b981', fontWeight: '700' },

  // Quick cards
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quickCard: { flex: 1 },
  quickCardInner: {
    borderRadius: 18, padding: 18, minHeight: 120,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  quickCardWide: {
    borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 8 },
  quickArrow: { fontSize: 16, color: 'rgba(255,255,255,0.5)' },
});
