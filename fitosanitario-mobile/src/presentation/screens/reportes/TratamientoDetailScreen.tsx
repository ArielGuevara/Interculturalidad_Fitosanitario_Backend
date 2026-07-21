import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { tratamientosApi } from '../../../infrastructure/data/tratamientos/tratamientosApi';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TratamientoDetail'>;

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  medicamento: 'medical-outline',
  dosis: 'flask-outline',
  volumen: 'water-outline',
  aplicacion: 'color-fill-outline',
  aplicaciones: 'repeat-outline',
  intervalo: 'calendar-outline',
  duracion: 'time-outline',
  carencia: 'ban-outline',
  reingreso: 'alarm-outline',
  etapa: 'leaf-outline',
  enciclopedia: 'book-outline',
  condiciones: 'sunny-outline',
};

function TechBlock({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.techBlock}>
      <View style={styles.techBlockInner}>
        <View style={styles.techIcon}>
          <Ionicons name={icon} size={20} color="#059669" />
        </View>
        <View style={styles.techContent}>
          <Text style={styles.techLabel}>{label}</Text>
          <Text style={styles.techValue}>{value}</Text>
        </View>
      </View>
      <View style={styles.techDivider} />
    </View>
  );
}

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
        <ActivityIndicator size="large" color="#059669" />
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

  const cultivosStr = (tratamiento.cultivos ?? [])
    .map(c => c.nombre.toUpperCase())
    .join(' • ') || tratamiento.cultivo?.nombre?.toUpperCase() || null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado secundario */}
      <Text style={styles.idText}>Tratamiento Oficial #{tratamiento.id}</Text>

      {/* Título principal */}
      <Text style={styles.nombre}>
        {tratamiento.nombre || tratamiento.producto?.nombreComercial || `Tratamiento #${tratamiento.id}`}
      </Text>

      {/* Cultivos + Plaga */}
      <View style={styles.chipRow}>
        {cultivosStr && <Text style={styles.chipText}>{cultivosStr}</Text>}
        {tratamiento.plaga && (
          <>
            {cultivosStr && <Text style={styles.chipDot}>·</Text>}
            <Text style={styles.chipTextPlaga}>{tratamiento.plaga.nombre.toUpperCase()}</Text>
          </>
        )}
      </View>

      {/* Descripción */}
      {tratamiento.descripcion ? (
        <View style={styles.descBox}>
          <Text style={styles.descripcion}>{tratamiento.descripcion}</Text>
        </View>
      ) : null}

      {/* Separador */}
      <View style={styles.sectionDivider} />

      {/* Información técnica */}
      <TechBlock icon={ICONS.medicamento} label="Medicamento" value={tratamiento.producto?.nombreComercial || '—'} />
      <TechBlock icon={ICONS.aplicacion} label="Método de aplicación" value={metodoLabel(tratamiento.metodoAplicacion)} />
      <TechBlock icon={ICONS.dosis} label="Dosis" value={`${tratamiento.dosis} ${tratamiento.unidadDosis}`} />
      {tratamiento.volumenAgua ? (
        <TechBlock icon={ICONS.volumen} label="Volumen de agua" value={`${tratamiento.volumenAgua} ${tratamiento.unidadVolumen || 'L'}`} />
      ) : null}
      <TechBlock icon={ICONS.aplicaciones} label="Aplicaciones" value={`${tratamiento.numeroAplicaciones}`} />
      <TechBlock icon={ICONS.intervalo} label="Intervalo" value={`${tratamiento.intervaloDias} día(s)`} />
      <TechBlock icon={ICONS.duracion} label="Duración total" value={`${tratamiento.duracionTotalDias} día(s)`} />
      <TechBlock icon={ICONS.carencia} label="Días de carencia" value={`${tratamiento.diasCarencia}`} />
      {tratamiento.periodoReingresoHoras != null ? (
        <TechBlock icon={ICONS.reingreso} label="Reingreso" value={`${tratamiento.periodoReingresoHoras} hora(s)`} />
      ) : null}
      {tratamiento.etapaCultivo ? (
        <TechBlock icon={ICONS.etapa} label="Etapa del cultivo" value={tratamiento.etapaCultivo} />
      ) : null}
      <TechBlock icon={ICONS.enciclopedia} label="Enciclopedia" value={tratamiento.enEnciclopedia ? 'Sí' : 'No'} />

      {/* Condiciones de aplicación */}
      {tratamiento.condicionesAplicacion ? (
        <View style={styles.condicionesBlock}>
          <View style={styles.condicionesHeader}>
            <Ionicons name={ICONS.condiciones} size={20} color="#059669" />
            <Text style={styles.condicionesLabel}>Condiciones de aplicación</Text>
          </View>
          <Text style={styles.condicionesValue}>{tratamiento.condicionesAplicacion}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Validado por {tratamiento.moderador?.nombre || 'moderador'}
        </Text>
        <Text style={styles.footerDate}>
          {new Date(tratamiento.fechaValidacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        {tratamiento.fechaUltimaActualizacion && (
          <Text style={styles.footerDate}>
            Actualizado {new Date(tratamiento.fechaUltimaActualizacion).toLocaleDateString('es-EC')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function metodoLabel(m: string): string {
  switch (m) {
    case 'FOLIAR': return 'Foliar';
    case 'SUELO': return 'Suelo';
    case 'RIEGO': return 'Riego';
    default: return m;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  notFound: { fontSize: 16, color: '#64748b' },

  idText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  nombre: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    lineHeight: 32,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  chipTextPlaga: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  chipDot: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  descBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  descripcion: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 21,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },

  techBlock: {
    paddingVertical: 4,
  },
  techBlockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  techIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  techContent: {
    flex: 1,
  },
  techLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  techValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  techDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },

  condicionesBlock: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  condicionesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  condicionesLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  condicionesValue: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },

  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 2,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  footerDate: { fontSize: 11, color: '#cbd5e1' },
});
