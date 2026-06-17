import React, { useState, useEffect } from 'react';
import {
  Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import type { Cultivo } from '../../../domain/catalogos/types';
import type { Plaga } from '../../../domain/catalogos/types';
import type { TipoRecomendacion } from '../../../domain/recomendaciones/types';

type Props = NativeStackScreenProps<AppStackParamList, 'RecomendacionForm'>;

export function RecomendacionFormScreen({ route, navigation }: Props) {
  const params = route.params || {};

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoRecomendacion>('RECOMENDACION');
  const [cultivoId, setCultivoId] = useState<number | undefined>(params.cultivoId);
  const [plagaId, setPlagaId] = useState<number | undefined>(params.plagaId);

  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [plagas, setPlagas] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(false);
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

  const tipos: { value: TipoRecomendacion; label: string; icon: string }[] = [
    { value: 'RECOMENDACION', label: 'Recomendación', icon: '💡' },
    { value: 'CONSULTA', label: 'Consulta', icon: '❓' },
    { value: 'CONOCIMIENTO_ANCESTRAL', label: 'Conocimiento Ancestral', icon: '🌿' },
  ];

  const onSubmit = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atención', 'El título es obligatorio');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Atención', 'La descripción es obligatoria');
      return;
    }

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
      Alert.alert('Éxito', 'Tu recomendación ha sido publicada', [
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nueva publicación</Text>
      <Text style={styles.subtitle}>Comparte tu conocimiento con la comunidad</Text>

      {/* Tipo */}
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.tipoRow}>
        {tipos.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.tipoChip, tipo === t.value && styles.tipoChipActive]}
            onPress={() => setTipo(t.value)}
          >
            <Text style={styles.tipoIcon}>{t.icon}</Text>
            <Text style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Título */}
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej: Control de gusano cogollero"
        placeholderTextColor="#94a3b8"
      />

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Describe detalladamente tu recomendación, práctica o consulta..."
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* Cultivo */}
      <Text style={styles.label}>Cultivo (opcional)</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, !cultivoId && styles.chipActive]}
          onPress={() => setCultivoId(undefined)}
        >
          <Text style={[styles.chipText, !cultivoId && styles.chipTextActive]}>Todos</Text>
        </Pressable>
        {cultivos.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, cultivoId === c.id && styles.chipActive]}
            onPress={() => setCultivoId(c.id)}
          >
            <Text style={[styles.chipText, cultivoId === c.id && styles.chipTextActive]}>
              {c.nombre}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Plaga */}
      <Text style={styles.label}>Plaga/Enfermedad (opcional)</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, !plagaId && styles.chipActive]}
          onPress={() => setPlagaId(undefined)}
        >
          <Text style={[styles.chipText, !plagaId && styles.chipTextActive]}>Ninguna</Text>
        </Pressable>
        {plagas.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.chip, plagaId === p.id && styles.chipActive]}
            onPress={() => setPlagaId(p.id)}
          >
            <Text style={[styles.chipText, plagaId === p.id && styles.chipTextActive]}>
              {p.nombre}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Botón guardar */}
      <Pressable
        style={[styles.btn, saving && styles.btnDisabled]}
        onPress={onSubmit}
        disabled={saving}
      >
        <Text style={styles.btnText}>
          {saving ? 'Publicando...' : 'Publicar en el foro'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 120,
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipoChipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  tipoIcon: { fontSize: 16 },
  tipoLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  tipoLabelActive: { color: '#059669' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  chipText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  chipTextActive: { color: '#059669', fontWeight: '700' },
  btn: {
    marginTop: 28,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
