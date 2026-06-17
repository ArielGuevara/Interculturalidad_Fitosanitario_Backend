import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { tratamientosApi } from '../../../infrastructure/data/tratamientos/tratamientosApi';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TratamientoDetail'>;

export function TratamientoDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [tratamiento, setTratamiento] = useState<TratamientoConRelaciones | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await tratamientosApi.getTratamientoById(id);
        setTratamiento(data);
      } catch (e) {
        console.error('Error cargando tratamiento:', e);
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

  if (!tratamiento) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Tratamiento no encontrado</Text>
      </View>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header - Cultivo + Plaga */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.cultivo}>{tratamiento.cultivo?.nombre || 'N/A'}</Text>
          <Text style={styles.badge}>
            {tratamiento.plaga?.tipo === 'ENFERMEDAD' ? '🦠' : '🐛'} {tratamiento.plaga?.nombre}
          </Text>
        </View>
      </View>

      {/* Producto */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Producto Recomendado</Text>
        <Text style={styles.productoNombre}>{tratamiento.producto?.nombreComercial || 'N/A'}</Text>
        <Text style={styles.productoTipo}>{tratamiento.producto?.tipo}</Text>
      </View>

      {/* Dosificación */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dosificación</Text>
        <InfoRow label="Dosis" value={`${tratamiento.dosis} ${tratamiento.unidadDosis}`} />
        {tratamiento.volumenAgua && (
          <InfoRow label="Volumen de agua" value={`${tratamiento.volumenAgua} ${tratamiento.unidadVolumen || ''}`} />
        )}
        <InfoRow label="Método de aplicación" value={tratamiento.metodoAplicacion} />
      </View>

      {/* Calendario */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calendario de Aplicación</Text>
        <InfoRow label="Intervalo" value={`Cada ${tratamiento.intervaloDias} día(s)`} />
        <InfoRow label="Aplicaciones" value={`${tratamiento.numeroAplicaciones} vez/veces`} />
        <InfoRow label="Duración total" value={`${tratamiento.duracionTotalDias} día(s)`} />
      </View>

      {/* Seguridad */}
      <View style={[styles.card, styles.warningCard]}>
        <Text style={[styles.cardTitle, { color: '#dc2626' }]}>⏸️ Seguridad</Text>
        <InfoRow label="Días de carencia" value={`${tratamiento.diasCarencia} día(s)`} />
        {tratamiento.periodoReingresoHoras != null && (
          <InfoRow label="Reingreso" value={`${tratamiento.periodoReingresoHoras} hora(s)`} />
        )}
      </View>

      {/* Info adicional */}
      {tratamiento.etapaCultivo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contexto</Text>
          <InfoRow label="Etapa del cultivo" value={tratamiento.etapaCultivo} />
          {tratamiento.condicionesAplicacion && (
            <InfoRow label="Condiciones" value={tratamiento.condicionesAplicacion} />
          )}
        </View>
      )}

      {/* Moderador */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Validado por: {tratamiento.moderador?.nombre || 'N/A'}
        </Text>
        <Text style={styles.footerDate}>
          {new Date(tratamiento.fechaValidacion).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf2' },
  notFound: { fontSize: 16, color: '#6b7280' },
  header: {
    backgroundColor: '#15803d',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  headerRow: { gap: 8 },
  cultivo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  badge: {
    fontSize: 14,
    color: '#bbf7d0',
    fontWeight: '600',
    marginTop: 4,
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
  warningCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fffbfb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  productoTipo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 14, color: '#64748b' },
  value: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  footer: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  footerText: { fontSize: 12, color: '#94a3b8' },
  footerDate: { fontSize: 11, color: '#94a3b8' },
});
