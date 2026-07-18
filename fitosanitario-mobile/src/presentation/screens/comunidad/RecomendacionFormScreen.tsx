import React, { useState, useEffect } from 'react';
import {
  Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { reportesApi } from '../../../infrastructure/data/reportes/reportesApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import type { Cultivo } from '../../../domain/catalogos/types';
import type { Plaga } from '../../../domain/catalogos/types';
import type { TipoRecomendacion } from '../../../domain/recomendaciones/types';

type Props = NativeStackScreenProps<AppStackParamList, 'RecomendacionForm'>;

const STEPS = [
  { key: 'tipo', label: 'Tipo', icon: 'options-outline' },
  { key: 'cultivo', label: 'Cultivo', icon: 'leaf-outline' },
  { key: 'plaga', label: 'Plaga', icon: 'bug-outline' },
  { key: 'titulo', label: 'Título', icon: 'text-outline' },
  { key: 'descripcion', label: 'Descripción', icon: 'document-text-outline' },
] as const;

export function RecomendacionFormScreen({ route, navigation }: Props) {
  const params = route.params || {};

  const [step, setStep] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoRecomendacion>('RECOMENDACION');
  const [cultivoId, setCultivoId] = useState<number | undefined>(params.cultivoId);
  const [plagaId, setPlagaId] = useState<number | undefined>(params.plagaId);

  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [plagas, setPlagas] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [c, p] = await Promise.all([getCultivos(), getPlagas()]);
        setCultivos(c);
        setPlagas(p);
      } catch (e) {
        console.error('Error cargando catálogos:', e);
      } finally {
        setLoading(false);
      }
    };
    loadCatalogs();
  }, []);

  const tipos: { value: TipoRecomendacion; label: string; iconName: any; desc: string }[] = [
    { value: 'RECOMENDACION', label: 'Recomendación', iconName: 'bulb-outline', desc: 'Comparte una práctica o consejo útil' },
    { value: 'CONSULTA', label: 'Consulta', iconName: 'help-circle-outline', desc: 'Pide ayuda a la comunidad' },
    { value: 'CONOCIMIENTO_ANCESTRAL', label: 'Ancestral', iconName: 'leaf-outline', desc: 'Saberes tradicionales y locales' },
  ];

  const canAdvance = () => {
    switch (STEPS[step].key) {
      case 'tipo': return true;
      case 'cultivo': return true;
      case 'plaga': return true;
      case 'titulo': return titulo.trim().length > 0;
      case 'descripcion': return descripcion.trim().length > 0;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const onSubmit = async () => {
    const suspension = await reportesApi.getSuspensionActiva();
    if (suspension) {
      const fin = new Date(suspension.fechaFin).toLocaleDateString();
      Alert.alert('Cuenta suspendida', `Tu cuenta está suspendida hasta el ${fin}. Motivo: ${suspension.motivo}`);
      return;
    }
    if (!titulo.trim()) { Alert.alert('Atención', 'El título es obligatorio'); return; }
    if (!descripcion.trim()) { Alert.alert('Atención', 'La descripción es obligatoria'); return; }

    try {
      setSaving(true);
      await recomendacionesApi.create({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        cultivoId,
        plagaId,
        reporteId: params.reporteId,
      });
      Alert.alert('Éxito', 'Tu publicación ha sido creada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo publicar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const renderStep = () => {
    switch (STEPS[step].key) {
      case 'tipo':
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué tipo de publicación es?</Text>
            <View style={styles.tipoGrid}>
              {tipos.map((t) => (
                <Pressable
                  key={t.value}
                  style={[styles.tipoCard, tipo === t.value && styles.tipoCardActive]}
                  onPress={() => setTipo(t.value)}
                >
                  <Ionicons name={t.iconName} size={32} color={tipo === t.value ? '#fff' : '#059669'} />
                  <Text style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.tipoDesc, tipo === t.value && styles.tipoDescActive]}>
                    {t.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'cultivo':
        return (
          <View>
            <Text style={styles.stepTitle}>Selecciona el cultivo</Text>
            <Text style={styles.stepSubtitle}>¿A qué cultivo está relacionada tu publicación?</Text>
            <Pressable
              style={[styles.selectChip, !cultivoId && styles.selectChipActive]}
              onPress={() => setCultivoId(undefined)}
            >
              <Ionicons name="apps" size={20} color={!cultivoId ? '#fff' : '#64748b'} />
              <Text style={[styles.selectChipText, !cultivoId && styles.selectChipTextActive]}>
                Todos los cultivos
              </Text>
            </Pressable>
            <View style={styles.chipGrid}>
              {cultivos.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.selectChip, cultivoId === c.id && styles.selectChipActive]}
                  onPress={() => setCultivoId(c.id)}
                >
                  <Ionicons name="leaf" size={16} color={cultivoId === c.id ? '#fff' : '#16a34a'} />
                  <Text style={[styles.selectChipText, cultivoId === c.id && styles.selectChipTextActive]}>
                    {c.nombre}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'plaga':
        return (
          <View>
            <Text style={styles.stepTitle}>¿Tiene plaga o enfermedad?</Text>
            <Text style={styles.stepSubtitle}>Selecciona si aplica (opcional)</Text>
            <Pressable
              style={[styles.selectChip, !plagaId && styles.selectChipActive]}
              onPress={() => setPlagaId(undefined)}
            >
              <Ionicons name="close" size={20} color={!plagaId ? '#fff' : '#64748b'} />
              <Text style={[styles.selectChipText, !plagaId && styles.selectChipTextActive]}>
                Ninguna
              </Text>
            </Pressable>
            <View style={styles.chipGrid}>
              {plagas.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.selectChip, plagaId === p.id && styles.selectChipActive, plagaId === p.id && { backgroundColor: '#dc2626', borderColor: '#dc2626' }]}
                  onPress={() => setPlagaId(p.id)}
                >
                  <Ionicons name="bug" size={16} color={plagaId === p.id ? '#fff' : '#dc2626'} />
                  <Text style={[styles.selectChipText, plagaId === p.id && styles.selectChipTextActive]}>
                    {p.nombre}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'titulo':
        return (
          <View>
            <Text style={styles.stepTitle}>Ponle un título</Text>
            <Text style={styles.stepSubtitle}>Sé claro y descriptivo</Text>
            <TextInput
              style={styles.bigInput}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Control de gusano cogollero en maíz"
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>
        );

      case 'descripcion':
        return (
          <View>
            <Text style={styles.stepTitle}>Describe tu publicación</Text>
            <Text style={styles.stepSubtitle}>Incluye todos los detalles relevantes</Text>
            <TextInput
              style={[styles.bigInput, styles.textArea]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe detalladamente tu recomendación, práctica o consulta..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.progressDot,
              i <= step ? styles.progressDotActive : styles.progressDotInactive,
              i === 0 && styles.progressDotFirst,
              i === STEPS.length - 1 && styles.progressDotLast,
            ]}
          />
        ))}
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Ionicons name={STEPS[step].icon} size={18} color="#059669" />
        <Text style={styles.stepIndicatorText}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step].label}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {renderStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <Ionicons name="arrow-back" size={20} color="#059669" />
            <Text style={styles.backBtnText}>Atrás</Text>
          </Pressable>
        ) : (
          <View />
        )}

        {step < STEPS.length - 1 ? (
          <Pressable
            style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
            onPress={nextStep}
            disabled={!canAdvance()}
          >
            <Text style={styles.nextBtnText}>Siguiente</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
            onPress={onSubmit}
            disabled={saving}
          >
            <Text style={styles.nextBtnText}>
              {saving ? 'Publicando...' : 'Publicar'}
            </Text>
            {!saving && <Ionicons name="checkmark" size={20} color="#fff" />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // Progress
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: { backgroundColor: '#059669' },
  progressDotInactive: { backgroundColor: '#e2e8f0' },
  progressDotFirst: {},
  progressDotLast: {},

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stepIndicatorText: { fontSize: 13, color: '#059669', fontWeight: '600' },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },

  // Tipo selector
  tipoGrid: { gap: 12 },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tipoCardActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  tipoLabel: { fontSize: 16, fontWeight: '700', color: '#374151', flex: 1 },
  tipoLabelActive: { color: '#fff' },
  tipoDesc: { fontSize: 11, color: '#94a3b8', maxWidth: 120, textAlign: 'right' },
  tipoDescActive: { color: '#d1fae5' },

  // Chip selector
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  selectChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  selectChipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  selectChipTextActive: { color: '#fff' },

  // Input
  bigInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 150,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
