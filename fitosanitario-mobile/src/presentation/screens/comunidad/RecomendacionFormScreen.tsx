import React, { useState, useEffect, useRef } from 'react';
import {
  Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet,
  ActivityIndicator, Image, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { reportesApi } from '../../../infrastructure/data/reportes/reportesApi';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import { getPlagas } from '../../../infrastructure/data/catalogos/plagasApi';
import { multimediaApi } from '../../../infrastructure/data/multimedia/multimediaApi';
import { getCache, setCache } from '../../../infrastructure/offline/cache';
import { enqueueRecomendacion } from '../../../infrastructure/offline/pendingRecomendaciones';
import type { Cultivo } from '../../../domain/catalogos/types';
import type { Plaga } from '../../../domain/catalogos/types';
import type { TipoRecomendacion } from '../../../domain/recomendaciones/types';

type Props = NativeStackScreenProps<AppStackParamList, 'RecomendacionForm'>;

const STEPS = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'cultivo', label: 'Cultivo / Plaga' },
  { key: 'contenido', label: 'Contenido' },
] as const;

export function RecomendacionFormScreen({ route, navigation }: Props) {
  const params = route.params || {};

  const [step, setStep] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoRecomendacion>('RECOMENDACION');
  const [cultivoId, setCultivoId] = useState<number | undefined>(params.cultivoId);
  const [plagaId, setPlagaId] = useState<number | undefined>(params.plagaId);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCultivoModal, setShowCultivoModal] = useState(false);
  const [showPlagaModal, setShowPlagaModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);

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
        await setCache('cultivos.list', c);
        await setCache('plagas.list', p);
      } catch {
        const [cc, pp] = await Promise.all([
          getCache<Cultivo[]>('cultivos.list'),
          getCache<Plaga[]>('plagas.list'),
        ]);
        if (cc) setCultivos(cc);
        if (pp) setPlagas(pp);
      } finally {
        setLoading(false);
      }
    };
    loadCatalogs();
  }, []);

  const tipos: { value: TipoRecomendacion; label: string; iconName: any; color: string }[] = [
    { value: 'RECOMENDACION', label: 'Recomendación', iconName: 'bulb-outline', color: '#059669' },
    { value: 'CONSULTA', label: 'Consulta', iconName: 'help-circle-outline', color: '#d97706' },
  ];

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setShowCamera(false);
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const canAdvance = () => {
    switch (STEPS[step].key) {
      case 'tipo': return !!tipo;
      case 'cultivo': return true;
      case 'contenido': return titulo.trim().length > 0 && descripcion.trim().length > 0;
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
    if (!titulo.trim()) { Alert.alert('Atención', 'El título es obligatorio'); return; }
    if (!descripcion.trim()) { Alert.alert('Atención', 'La descripción es obligatoria'); return; }

    try {
      const suspension = await reportesApi.getSuspensionActiva();
      if (suspension) {
        const fin = new Date(suspension.fechaFin).toLocaleDateString();
        Alert.alert('Cuenta suspendida', `Tu cuenta está suspendida hasta el ${fin}. Motivo: ${suspension.motivo}`);
        return;
      }
    } catch {
      // ignore suspension check error
    }

    let payload: any;

    try {
      setSaving(true);
      let imagenUrl: string | undefined;
      if (imageUri) {
        setUploadingImg(true);
        try {
          imagenUrl = await multimediaApi.uploadImage(imageUri);
        } catch {
          // ignore image upload error in offline mode
        }
      }

      payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
      };
      if (cultivoId !== undefined) payload.cultivoId = cultivoId;
      if (plagaId !== undefined) payload.plagaId = plagaId;
      if (params.reporteId !== undefined) payload.reporteId = params.reporteId;
      if (imagenUrl !== undefined) payload.imagenUrl = imagenUrl;

      await recomendacionesApi.create(payload);
      Alert.alert('Éxito', 'Tu publicación ha sido creada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      if (e?.message?.includes('Network') || e?.message?.includes('network') || e?.code === 'ERR_NETWORK') {
        await enqueueRecomendacion(payload);
        Alert.alert('Guardado offline', 'No hay conexión. Se enviará automáticamente cuando tengas internet.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Error al publicar';
        Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
      }
    } finally {
      setSaving(false);
      setUploadingImg(false);
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
                  <Ionicons name={t.iconName} size={28} color={tipo === t.value ? '#fff' : t.color} />
                  <Text style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'cultivo': {
        const selectedCultivo = cultivos.find((c) => c.id === cultivoId);
        const selectedPlaga = plagas.find((p) => p.id === plagaId);

        return (
          <View>
            <Text style={styles.stepTitle}>Cultivo y plaga</Text>

            <Text style={styles.sectionLabel}>Cultivo</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowCultivoModal(true)}>
              {selectedCultivo ? (
                <>
                  <Ionicons name="leaf" size={20} color="#16a34a" />
                  <Text style={styles.pickerText}>{selectedCultivo.nombre}</Text>
                  <Pressable onPress={() => setCultivoId(undefined)} hitSlop={12}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Ionicons name="leaf-outline" size={20} color="#94a3b8" />
                  <Text style={styles.pickerPlaceholder}>Seleccionar cultivo</Text>
                  <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                </>
              )}
            </Pressable>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Plaga (opcional)</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowPlagaModal(true)}>
              {selectedPlaga ? (
                <>
                  <Ionicons name="bug" size={20} color="#dc2626" />
                  <Text style={styles.pickerText}>{selectedPlaga.nombre}</Text>
                  <Pressable onPress={() => setPlagaId(undefined)} hitSlop={12}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Ionicons name="bug-outline" size={20} color="#94a3b8" />
                  <Text style={styles.pickerPlaceholder}>Seleccionar plaga (opcional)</Text>
                  <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                </>
              )}
            </Pressable>
          </View>
        );
      }

      case 'contenido':
        return (
          <View>
            <Text style={styles.stepTitle}>Título y descripción</Text>

            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Título de la publicación"
              placeholderTextColor="#94a3b8"
              autoFocus
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe tu recomendación o consulta en detalle..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Foto (opcional)</Text>
            <Pressable style={styles.photoBtn} onPress={openCamera} disabled={uploadingImg || saving}>
              <Ionicons name="camera-outline" size={22} color="#059669" />
              <Text style={styles.photoBtnText}>Tomar foto</Text>
            </Pressable>
            {imageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <Pressable style={styles.removeImage} onPress={() => setImageUri(null)} disabled={uploadingImg}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </Pressable>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.progressDot,
              i <= step ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.stepIndicator}>
        <Ionicons name="checkmark-circle" size={16} color="#059669" />
        <Text style={styles.stepIndicatorText}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step].label}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {renderStep()}
      </ScrollView>

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
          <Pressable style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]} onPress={nextStep} disabled={!canAdvance()}>
            <Text style={styles.nextBtnText}>Siguiente</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={[styles.nextBtn, (saving || uploadingImg) && styles.nextBtnDisabled]} onPress={onSubmit} disabled={saving || uploadingImg}>
            <Text style={styles.nextBtnText}>
              {uploadingImg ? 'Subiendo imagen...' : saving ? 'Publicando...' : 'Publicar'}
            </Text>
            {!saving && !uploadingImg && <Ionicons name="checkmark" size={20} color="#fff" />}
          </Pressable>
        )}
      </View>

      {/* Cultivo Modal */}
      <Modal visible={showCultivoModal} transparent animationType="fade" onRequestClose={() => setShowCultivoModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCultivoModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Seleccionar cultivo</Text>
            <ScrollView style={styles.modalList}>
              {cultivos.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.modalItem, cultivoId === c.id && styles.modalItemActive]}
                  onPress={() => { setCultivoId(c.id); setShowCultivoModal(false); }}
                >
                  <Ionicons name="leaf" size={20} color={cultivoId === c.id ? '#fff' : '#16a34a'} />
                  <Text style={[styles.modalItemText, cultivoId === c.id && styles.modalItemTextActive]}>{c.nombre}</Text>
                  {cultivoId === c.id && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Plaga Modal */}
      <Modal visible={showPlagaModal} transparent animationType="fade" onRequestClose={() => setShowPlagaModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPlagaModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Seleccionar plaga (opcional)</Text>
            <Pressable
              style={[styles.modalItem, plagaId === undefined && styles.modalItemActive]}
              onPress={() => { setPlagaId(undefined); setShowPlagaModal(false); }}
            >
              <Ionicons name="close-outline" size={20} color={plagaId === undefined ? '#fff' : '#94a3b8'} />
              <Text style={[styles.modalItemText, plagaId === undefined && styles.modalItemTextActive]}>Ninguna</Text>
            </Pressable>
            <ScrollView style={styles.modalList}>
              {plagas.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.modalItem, plagaId === p.id && styles.modalItemPlagaActive]}
                  onPress={() => { setPlagaId(p.id); setShowPlagaModal(false); }}
                >
                  <Ionicons name="bug" size={20} color={plagaId === p.id ? '#fff' : '#dc2626'} />
                  <Text style={[styles.modalItemText, plagaId === p.id && styles.modalItemTextActive]}>{p.nombre}</Text>
                  {plagaId === p.id && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          <View style={styles.cameraOverlay}>
            <Pressable style={styles.cameraCloseBtn} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Pressable style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureBtnInner} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 6,
    alignItems: 'center',
  },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  progressDotActive: { backgroundColor: '#059669' },
  progressDotInactive: { backgroundColor: '#e2e8f0' },

  stepIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingBottom: 16 },
  stepIndicatorText: { fontSize: 13, color: '#059669', fontWeight: '600' },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 4 },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pickerText: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  pickerPlaceholder: { fontSize: 15, fontWeight: '500', color: '#94a3b8', flex: 1 },

  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  textArea: { minHeight: 120 },

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
  tipoCardActive: { backgroundColor: '#059669', borderColor: '#059669' },
  tipoLabel: { fontSize: 16, fontWeight: '700', color: '#374151' },
  tipoLabelActive: { color: '#fff' },

  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 12,
  },
  photoBtnText: { fontSize: 15, fontWeight: '700', color: '#059669' },

  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
  },

  // Modal pickers
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalList: { maxHeight: 200 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  modalItemActive: { backgroundColor: '#059669' },
  modalItemPlagaActive: { backgroundColor: '#dc2626' },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  modalItemTextActive: { color: '#fff' },

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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16 },
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

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
    paddingBottom: 60,
  },
  cameraCloseBtn: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
