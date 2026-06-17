import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { reportesApi } from '../../../infrastructure/data/reportes/reportesApi';
import { tratamientosApi } from '../../../infrastructure/data/tratamientos/tratamientosApi';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';
import { useNavigation } from '@react-navigation/native';

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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await reportesApi.getReporteById(id);
        setReporte(data);

        // Check if report has a treatment
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
        <Text style={styles.metaText}>
          📍 {reporte.latitud?.toFixed(4)}, {reporte.longitud?.toFixed(4)}
        </Text>
      </View>

      {/* Cultivo y plaga */}
      <View style={styles.infoRow}>
        {reporte.cultivo && (
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>🌱 {reporte.cultivo.nombre || `Cultivo #${reporte.cultivoId}`}</Text>
          </View>
        )}
        {reporte.plaga && (
          <View style={[styles.infoChip, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.infoChipText, { color: '#dc2626' }]}>
              🐛 {reporte.plaga.nombre || `Plaga #${reporte.plagaId}`}
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
              <Image
                key={i}
                source={{ uri: url }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Audio */}
      {reporte.audioUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio</Text>
          <Text style={styles.audioPlaceholder}>🎤 Audio disponible</Text>
        </View>
      )}

      {/* Treatment info */}
      {tratamiento ? (
        <Pressable
          style={styles.treatmentCard}
          onPress={() => navigation.navigate('TratamientoDetail', { id: tratamiento.id })}
        >
          <Text style={styles.treatmentTitle}>✅ Tratamiento oficial</Text>
          <Text style={styles.treatmentProduct}>
            {tratamiento.producto?.nombreComercial || 'Producto'}
          </Text>
          <Text style={styles.treatmentDosis}>
            {tratamiento.dosis} {tratamiento.unidadDosis}
          </Text>
          <Text style={styles.treatmentCarencia}>
            ⏸️ {tratamiento.diasCarencia} días de carencia
          </Text>
          <Text style={styles.treatmentView}>Ver detalle →</Text>
        </Pressable>
      ) : reporte.estado === 'VALIDADO' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Validado</Text>
          <Text style={styles.descText}>Este reporte ha sido validado por un agrónomo</Text>
        </View>
      ) : reporte.estado === 'RECHAZADO' ? (
        <View style={[styles.card, { borderColor: '#fecaca' }]}>
          <Text style={[styles.cardTitle, { color: '#dc2626' }]}>❌ Rechazado</Text>
          <Text style={styles.descText}>{reporte.motivoRechazo || 'El reporte fue rechazado'}</Text>
        </View>
      ) : null}
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
});
