import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { reportesApi } from '../../../infrastructure/data/reportes/reportesApi';
import { tratamientosApi } from '../../../infrastructure/data/tratamientos/tratamientosApi';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';
import type { HistorialEntry } from '../../../domain/reportes/types';
import { useNavigation } from '@react-navigation/native';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';

const { width: W } = Dimensions.get('window');

type Props = NativeStackScreenProps<AppStackParamList, 'ReporteDetail'>;

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  COMUNIDAD: '#3b82f6',
  VALIDADO: '#10b981',
  RECHAZADO: '#ef4444',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  COMUNIDAD: 'En comunidad',
  VALIDADO: 'Validado',
  RECHAZADO: 'Rechazado',
};

export function ReporteDetailScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [reporte, setReporte] = useState<any>(null);
  const [tratamiento, setTratamiento] = useState<TratamientoConRelaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, hist] = await Promise.all([
          reportesApi.getReporteById(id),
          reportesApi.getHistorial(id).catch(() => [] as HistorialEntry[]),
        ]);
        setReporte(data);
        setHistorial(hist);

        const t = await tratamientosApi.getTratamientoByReporte(id);
        if (t) setTratamiento(t);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!reporte) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#6b7280' }}>Reporte no encontrado</Text>
      </View>
    );
  }

  const estadoColor = ESTADO_COLORS[reporte.estado] || '#6b7280';
  const estadoLabel = ESTADO_LABELS[reporte.estado] || reporte.estado;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Estado badge */}
      <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '20' }]}>
        <View style={[styles.estadoDot, { backgroundColor: estadoColor }]} />
        <Text style={[styles.estadoText, { color: estadoColor }]}>{estadoLabel}</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>{reporte.titulo}</Text>

      {/* Fecha y ubicación */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {new Date(reporte.createdAt || reporte.fecha).toLocaleDateString()}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text style={styles.metaText}>
            {reporte.latitud?.toFixed(4)}, {reporte.longitud?.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Cultivo y plaga */}
      <View style={styles.infoRow}>
        {reporte.cultivo && (
          <View style={styles.infoChip}>
            <Ionicons name="leaf" size={14} color="#16a34a" />
            <Text style={styles.infoChipText}> {reporte.cultivo.nombre || `Cultivo #${reporte.cultivoId}`}</Text>
          </View>
        )}
        {reporte.plaga && (
          <View style={[styles.infoChip, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="bug" size={14} color="#dc2626" />
            <Text style={[styles.infoChipText, { color: '#dc2626' }]}>
              {reporte.plaga.nombre || `Plaga #${reporte.plagaId}`}
            </Text>
          </View>
        )}
      </View>

      {/* Descripción */}
      {(reporte.descripcion || reporte.descripcionProblema) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción del problema</Text>
          <Text style={styles.descText}>{reporte.descripcion || reporte.descripcionProblema}</Text>
        </View>
      )}

      {/* Imágenes */}
      {reporte.imagenesUrls && reporte.imagenesUrls.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fotos ({reporte.imagenesUrls.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {reporte.imagenesUrls.map((url: string, i: number) => (
              <Pressable key={i} onPress={() => setSelectedImage(url)}>
                <Image
                  source={{ uri: url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Audio */}
      {reporte.audioUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="mic-outline" size={16} color="#64748b" />
            <Text style={styles.audioPlaceholder}>Audio disponible</Text>
          </View>
        </View>
      )}

      {/* Treatment info */}
      {tratamiento ? (
        <Pressable
          style={styles.treatmentCard}
          onPress={() => navigation.navigate('TratamientoDetail', { id: tratamiento.id })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.treatmentTitle}>Tratamiento oficial</Text>
          </View>
          <Text style={styles.treatmentProduct}>
            {tratamiento.producto?.nombreComercial || 'Producto'}
          </Text>
          <Text style={styles.treatmentDosis}>
            {tratamiento.dosis} {tratamiento.unidadDosis}
          </Text>
          <Text style={styles.treatmentCarencia}>
            <Ionicons name="pause-circle-outline" size={16} color="#dc2626" /> {tratamiento.diasCarencia} días de carencia
          </Text>
          <Text style={styles.treatmentView}>Ver detalle →</Text>
        </Pressable>
      ) : reporte.estado === 'COMUNIDAD' ? (
        <View style={styles.comunidadCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubbles-outline" size={18} color="#3b82f6" />
            <Text style={styles.comunidadTitle}>En comunidad</Text>
          </View>
          <Text style={styles.comunidadDesc}>
            Este reporte está siendo discutido por la comunidad. Participa compartiendo tu conocimiento.
          </Text>
          <View style={styles.comunidadActions}>
            <Pressable
              style={styles.comunidadBtn}
              onPress={() =>
                navigation.navigate('RecomendacionForm', {
                  reporteId: reporte.id,
                  cultivoId: reporte.cultivoId,
                  plagaId: reporte.plagaId ?? undefined,
                })
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.comunidadBtnText}>Publicar recomendación</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.comunidadBtnSecondary}
              onPress={() => navigation.navigate('ForoList')}
            >
              <Text style={styles.comunidadBtnTextSecondary}>→ Ir al Foro</Text>
            </Pressable>
          </View>
        </View>
      ) : reporte.estado === 'VALIDADO' ? (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.cardTitle}>Validado</Text>
          </View>
          <Text style={styles.descText}>Este reporte ha sido validado por un agrónomo</Text>
        </View>
      ) : reporte.estado === 'RECHAZADO' ? (
        <View style={[styles.card, { borderColor: '#fecaca' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="close-circle" size={18} color="#dc2626" />
            <Text style={[styles.cardTitle, { color: '#dc2626' }]}>Rechazado</Text>
          </View>
          <Text style={styles.descText}>{reporte.motivoRechazo || 'El reporte fue rechazado'}</Text>
        </View>
      ) : null}

      {/* Historial */}
      {historial.length > 0 && (
        <View style={styles.historialCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="list-outline" size={18} color="#0f172a" />
            <Text style={styles.historialTitle}>Historial del reporte</Text>
          </View>
          {historial.map((h, _i) => {
            const color = ESTADO_COLORS[h.estadoNuevo] || '#6b7280';
            const label = ESTADO_LABELS[h.estadoNuevo] || h.estadoNuevo;
            return (
              <View key={h.id} style={styles.historialItem}>
                <View style={styles.historialDot} />
                <View style={styles.historialContent}>
                  <View style={styles.historialTop}>
                    <View style={[styles.historialBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.historialBadgeText, { color }]}>{label}</Text>
                    </View>
                    <Text style={styles.historialDate}>
                      {new Date(h.fechaCambio).toLocaleDateString()}
                    </Text>
                  </View>
                  {h.usuario && (
                    <Text style={styles.historialActor}>por {h.usuario.nombre}</Text>
                  )}
                  {h.motivo && (
                    <Text style={styles.historialMotivo}>{h.motivo}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <ImageViewerModal
        visible={selectedImage !== null}
        imageUrl={selectedImage ?? ''}
        onClose={() => setSelectedImage(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf2' },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  estadoDot: { width: 8, height: 8, borderRadius: 4 },
  estadoText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  metaRow: { gap: 4, marginBottom: 12 },
  metaText: { fontSize: 13, color: '#64748b' },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  infoChipText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  descText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  imageRow: { flexDirection: 'row', gap: 8 },
  image: { width: W * 0.5, height: W * 0.4, borderRadius: 12 },
  audioPlaceholder: { fontSize: 14, color: '#64748b' },
  treatmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#059669',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  treatmentTitle: { fontSize: 15, fontWeight: '700', color: '#059669', marginBottom: 8 },
  treatmentProduct: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  treatmentDosis: { fontSize: 14, color: '#64748b', marginTop: 2 },
  treatmentCarencia: { fontSize: 13, color: '#dc2626', marginTop: 4 },
  treatmentView: { fontSize: 13, fontWeight: '600', color: '#059669', marginTop: 8 },

  // Comunidad
  comunidadCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  comunidadTitle: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  comunidadDesc: { fontSize: 13, color: '#1e40af', lineHeight: 18, opacity: 0.8 },
  comunidadActions: { gap: 8 },
  comunidadBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  comunidadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  comunidadBtnSecondary: {
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  comunidadBtnTextSecondary: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  // Historial
  historialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historialTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  historialItem: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 4,
    marginBottom: 10,
  },
  historialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginTop: 5,
  },
  historialContent: { flex: 1 },
  historialTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historialBadgeText: { fontSize: 11, fontWeight: '700' },
  historialDate: { fontSize: 11, color: '#94a3b8' },
  historialActor: { fontSize: 12, color: '#64748b', marginTop: 1 },
  historialMotivo: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 2 },
});
