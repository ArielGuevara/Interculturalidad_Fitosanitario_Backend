import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { enqueueReporte } from '../../../infrastructure/offline/pendingReportes';
import { syncPendingReportes } from '../../../infrastructure/offline/sync';
import { getCultivos } from '../../../infrastructure/data/catalogos/cultivosApi';
import type { Cultivo } from '../../../domain/catalogos/types';
import { ImageViewerModal } from '../../../presentation/components/ImageViewerModal';
import { useAccessibility } from '../../../shared/contexts/AccessibilityContext';
import { AccessibleButton } from '../../../shared/components/AccessibleButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ensureDocDir() {
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
}

// ─── Photo Preview Modal ────────────────────────────────────────────────────
function PhotoPreviewModal({
  uri,
  onAccept,
  onRetake,
}: {
  uri: string;
  onAccept: () => void;
  onRetake: () => void;
}) {
  const [zoomPreview, setZoomPreview] = useState(false);

  if (zoomPreview) {
    return (
      <Modal visible animationType="fade" statusBarTranslucent>
        <View style={styles.previewContainer}>
          <ScrollView
            contentContainerStyle={styles.zoomContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
          >
            <Pressable onPress={() => setZoomPreview(false)}>
              <Image source={{ uri }} style={styles.previewImageZoom} resizeMode="contain" />
            </Pressable>
          </ScrollView>
          <Pressable style={styles.zoomCloseBtn} onPress={() => setZoomPreview(false)}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={styles.previewContainer}>
        <Pressable onPress={() => setZoomPreview(true)}>
          <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" />
        </Pressable>
        <View style={styles.previewHint}>
          <Text style={styles.previewHintText}>Toca la imagen para hacer zoom</Text>
        </View>
        <View style={styles.previewActions}>
          <Pressable style={[styles.previewBtn, styles.previewBtnSecondary]} onPress={onRetake}>
            <Text style={styles.previewBtnTextSecondary}>  Repetir</Text>
          </Pressable>
          <Pressable style={[styles.previewBtn, styles.previewBtnPrimary]} onPress={onAccept}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.previewBtnTextPrimary}>Aceptar</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Image Gallery ───────────────────────────────────────────────────────────
function ImageGallery({
  uris,
  onDelete,
  onPress,
}: {
  uris: string[];
  onDelete: (index: number) => void;
  onPress: (index: number) => void;
}) {
  if (uris.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
      {uris.map((uri, i) => (
        <Pressable key={uri} onPress={() => onPress(i)}>
          <View style={styles.galleryItem}>
            <Image source={{ uri }} style={styles.galleryThumb} />
            <Pressable
              style={styles.galleryDelete}
              onPress={() =>
                Alert.alert('Eliminar foto', '¿Deseas eliminar esta foto?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(i) },
                ])
              }
            >
              <Ionicons name="close" size={11} color="#fff" />
            </Pressable>
            <View style={styles.galleryBadge}>
              <Text style={styles.galleryBadgeText}>{i + 1}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Audio Waveform (decorative) ─────────────────────────────────────────────
function RecordingWave({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  const anims = useRef(bars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (isRecording) {
      const animations = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 60),
            Animated.timing(anim, { toValue: 1, duration: 300 + Math.random() * 200, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.2, duration: 300 + Math.random() * 200, useNativeDriver: true }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    } else {
      anims.forEach((anim) => anim.setValue(0.3));
    }
  }, [isRecording]);

  return (
    <View style={styles.waveContainer}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              transform: [{ scaleY: anim }],
              backgroundColor: isRecording ? '#ef4444' : '#10b981',
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Recording Timer ─────────────────────────────────────────────────────────
function useRecordingTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function CreateReporteScreen() {
  const { easyMode, speak, haptic } = useAccessibility();
  const [wizardStep, setWizardStep] = useState(1);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cultivoId, setCultivoId] = useState<number>(0);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [cultivosLoading, setCultivosLoading] = useState(true);

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const [cameraMode, setCameraMode] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const isRecording = recording !== null;
  const timer = useRecordingTimer(isRecording);

  const [isSaving, setIsSaving] = useState(false);

  const canTakeMore = imageUris.length < 10;
  const locationReady = useMemo(() => latitud !== null && longitud !== null, [latitud, longitud]);

  // Pulse animation for record button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCultivos();
        setCultivos(data);
      } catch {
        // silently fail, user can still type
      } finally {
        setCultivosLoading(false);
      }
    };
    load();
  }, []);

  const DEF_LAT = 0.4167;
  const DEF_LNG = -78.5833;

  const getLocation = async () => {
    setLocationLoading(true);
    setLocationError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLatitud(DEF_LAT);
        setLongitud(DEF_LNG);
        setLocationError(true);
        setLocationLoading(false);
        return;
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setLatitud(last.coords.latitude);
        setLongitud(last.coords.longitude);
        setLocationError(false);
        setLocationLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
      });
      setLatitud(pos.coords.latitude);
      setLongitud(pos.coords.longitude);
      setLocationError(false);
    } catch (e: any) {
      console.log('[GPS] Error:', e?.message);
      setLatitud(DEF_LAT);
      setLongitud(DEF_LNG);
      setLocationError(true);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
        return;
      }
    }
    setCameraMode(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    if (!canTakeMore) {
      Alert.alert('Límite alcanzado', 'Puedes tomar máximo 10 imágenes.');
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      // Save to persistent location first
      const ext = photo.uri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      const dest = `${ensureDocDir()}reporte_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      await FileSystem.copyAsync({ from: photo.uri, to: dest });
      // Show preview before accepting
      setPendingPhotoUri(dest);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo tomar la foto');
    }
  };

  const acceptPhoto = useCallback(() => {
    if (!pendingPhotoUri) return;
    setImageUris((prev) => [...prev, pendingPhotoUri]);
    setPendingPhotoUri(null);
    setCameraMode(false);
  }, [pendingPhotoUri]);

  const retakePhoto = useCallback(async () => {
    // Delete the pending file and let them retake
    if (pendingPhotoUri) {
      try { await FileSystem.deleteAsync(pendingPhotoUri, { idempotent: true }); } catch {}
    }
    setPendingPhotoUri(null);
    // Camera stays open
  }, [pendingPhotoUri]);

  const deleteImage = useCallback(async (index: number) => {
    const uri = imageUris[index];
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  }, [imageUris]);

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita micrófono para grabar audio.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;
      const dest = `${ensureDocDir()}audio_${Date.now()}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      setAudioUri(dest);
    } catch (e: any) {
      setRecording(null);
      Alert.alert('Error', e?.message || 'No se pudo detener la grabación');
    }
  };

  const deleteAudio = () => {
    Alert.alert('Eliminar audio', '¿Deseas eliminar la grabación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          if (audioUri) {
            try { await FileSystem.deleteAsync(audioUri, { idempotent: true }); } catch {}
          }
          setAudioUri(null);
        }
      },
    ]);
  };

  const saveOfflineAndSync = async () => {
    if (!titulo.trim()) {
      if (easyMode) { speak('Escriba un título para el reporte'); }
      Alert.alert('Falta información', 'El título es obligatorio.');
      return;
    }
    if (!cultivoId || cultivoId === 0) {
      if (easyMode) { speak('Seleccione un cultivo'); }
      Alert.alert('Falta información', 'Selecciona un cultivo.');
      return;
    }
    if (!locationReady || latitud === null || longitud === null) {
      if (easyMode) { speak('Espere a que se obtenga la ubicación'); }
      Alert.alert('Falta información', 'La ubicación no está disponible. Espera a que se obtenga o actualícela.');
      return;
    }
    setIsSaving(true);
    try {
      await enqueueReporte({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        cultivoId,
        latitud,
        longitud,
        imageUris,
        audioUri: audioUri ?? undefined,
      });
      try {
        const result = await syncPendingReportes();
        if (easyMode) { speak('Reporte enviado correctamente'); }
        Alert.alert(
          '✓ Reporte enviado',
          `Guardado correctamente.\nEnviados: ${result.synced}  |  Fallidos: ${result.failed}`
        );
      } catch {
        if (easyMode) { speak('Reporte guardado sin conexión'); }
        Alert.alert('Guardado offline', `El reporte se sincronizará cuando haya conexión.`);
      }
      setTitulo('');
      setDescripcion('');
      setCultivoId(0);
      setImageUris([]);
      setAudioUri(null);
      setWizardStep(1);
      getLocation();
    } finally {
      setIsSaving(false);
    }
  };

  // ── Camera View ──────────────────────────────────────────────────────────
  if (cameraMode) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Overlay frame guide */}
        <View style={styles.cameraOverlay} pointerEvents="none">
          <View style={styles.cameraFrame} />
        </View>

        <View style={styles.cameraControls}>
          <Text style={styles.cameraCounter}>{imageUris.length}/10</Text>
          <Pressable style={styles.cameraShutter} onPress={takePhoto}>
            <View style={styles.cameraShutterInner} />
          </Pressable>
          <Pressable style={styles.cameraCancelBtn} onPress={() => setCameraMode(false)}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Photo preview modal appears on top of camera */}
        {pendingPhotoUri && (
          <PhotoPreviewModal
            uri={pendingPhotoUri}
            onAccept={acceptPhoto}
            onRetake={retakePhoto}
          />
        )}
      </View>
    );
  }

  // ── Wizard Mode (Easy) ──────────────────────────────────────────────────
  if (easyMode) {
    const cultivoActual = cultivos.find((c) => c.id === cultivoId);

    return (
      <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
        {/* Step indicator */}
        <View style={wizardStyles.stepBar}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[wizardStyles.stepDot, wizardStep >= s && wizardStyles.stepDotActive]}>
              <Text style={[wizardStyles.stepNum, wizardStep >= s && wizardStyles.stepNumActive]}>
                {s === 1 ? '1' : s === 2 ? '2' : '3'}
              </Text>
            </View>
          ))}
          <View style={wizardStyles.stepLine} />
        </View>

        {wizardStep === 1 && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="leaf-outline" size={48} color="#15803d" />
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8 }}>Paso 1</Text>
              <Text style={{ fontSize: 15, color: '#64748b', marginTop: 4 }}>¿Qué cultivo tiene el problema?</Text>
            </View>
            {cultivosLoading ? (
              <ActivityIndicator size="large" color="#10b981" />
            ) : (
              <View style={{ gap: 12 }}>
                {cultivos.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => { haptic(); setCultivoId(c.id); }}
                    style={[
                      wizardStyles.cultivoCard,
                      cultivoId === c.id && wizardStyles.cultivoCardSelected,
                    ]}
                  >
                    <Ionicons
                      name="leaf"
                      size={32}
                      color={cultivoId === c.id ? '#fff' : '#15803d'}
                    />
                    <Text style={[
                      wizardStyles.cultivoLabel,
                      cultivoId === c.id && { color: '#fff' },
                    ]}>
                      {c.nombre}
                    </Text>
                    {cultivoId === c.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
            <AccessibleButton
              icon="arrow-forward"
              label="Siguiente"
              onPress={() => {
                if (!cultivoId || cultivoId === 0) {
                  speak('Seleccione un cultivo primero');
                  return;
                }
                speak('Paso 2, tome fotos del problema');
                setWizardStep(2);
              }}
              color="#15803d"
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        )}

        {wizardStep === 2 && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="camera-outline" size={48} color="#15803d" />
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8 }}>Paso 2</Text>
              <Text style={{ fontSize: 15, color: '#64748b', marginTop: 4 }}>Tome fotos del problema</Text>
            </View>

            {/* Location status */}
            <View style={[wizardStyles.card, { marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={locationReady ? 'checkmark-circle' : 'time-outline'}
                  size={22}
                  color={locationReady ? '#10b981' : '#f59e0b'}
                />
                <Text style={{ fontWeight: '600', color: '#334155', flex: 1 }}>
                  {locationReady ? 'Ubicación lista' : 'Obteniendo ubicación...'}
                </Text>
                <Pressable onPress={getLocation} style={{ padding: 8 }}>
                  <Ionicons name="refresh-outline" size={20} color="#10b981" />
                </Pressable>
              </View>
            </View>

            {/* Title input */}
            <View style={[wizardStyles.card, { marginBottom: 16 }]}>
              <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>  Título del reporte</Text>
              <TextInput
                style={wizardStyles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ej. Mancha en hojas de maíz"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Photos */}
            <ImageGallery uris={imageUris} onDelete={deleteImage} onPress={(i) => setSelectedImage(imageUris[i])} />
            <AccessibleButton
              icon="camera"
              label={canTakeMore ? 'Tomar foto' : 'Límite alcanzado'}
              onPress={openCamera}
              color="#059669"
              disabled={!canTakeMore}
              style={{ marginBottom: 16 }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AccessibleButton
                icon="arrow-back"
                label="Atrás"
                onPress={() => { speak('Paso 1, seleccione cultivo'); setWizardStep(1); }}
                color="#64748b"
                style={{ flex: 1 }}
              />
              <AccessibleButton
                icon="arrow-forward"
                label="Siguiente"
                onPress={() => { speak('Paso 3, grabe audio y finalice'); setWizardStep(3); }}
                color="#15803d"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        )}

        {wizardStep === 3 && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="mic-outline" size={48} color="#15803d" />
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8 }}>Paso 3</Text>
              <Text style={{ fontSize: 15, color: '#64748b', marginTop: 4 }}>Audio y finalizar</Text>
            </View>

            {/* Audio */}
            <View style={wizardStyles.card}>
              <RecordingWave isRecording={isRecording} />
              {isRecording ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
                  <Ionicons name="radio-button-on" size={16} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontWeight: '600' }}>Grabando... {timer}</Text>
                </View>
              ) : audioUri ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
                  <Ionicons name="checkmark" size={16} color="#10b981" />
                  <Text style={{ color: '#10b981', fontWeight: '600' }}>Audio listo</Text>
                </View>
              ) : null}
              <AccessibleButton
                icon={isRecording ? 'stop' : 'mic'}
                label={isRecording ? 'Detener' : audioUri ? 'Volver a grabar' : 'Grabar audio'}
                onPress={isRecording ? stopRecording : startRecording}
                color={isRecording ? '#ef4444' : '#10b981'}
              />
              {audioUri && (
                <Pressable onPress={deleteAudio} style={{ alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: '#ef4444', fontWeight: '600' }}>Eliminar audio</Text>
                </Pressable>
              )}
            </View>

            {/* Summary */}
            <View style={[wizardStyles.card, { marginTop: 16 }]}>
              <Text style={{ fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>Resumen</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Ionicons name="leaf" size={16} color="#10b981" />
                <Text style={{ color: '#475569' }}>{cultivoActual?.nombre || 'No seleccionado'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="camera" size={16} color="#10b981" />
                <Text style={{ color: '#475569' }}>{imageUris.length} foto(s)</Text>
              </View>
              {audioUri && (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="mic" size={16} color="#10b981" />
                  <Text style={{ color: '#475569' }}>Audio grabado</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <AccessibleButton
                icon="arrow-back"
                label="Atrás"
                onPress={() => { speak('Paso 2, tome fotos'); setWizardStep(2); }}
                color="#64748b"
                style={{ flex: 1 }}
              />
              <AccessibleButton
                icon="checkmark"
                label={isSaving ? 'Guardando...' : 'Guardar'}
                onPress={saveOfflineAndSync}
                color="#15803d"
                style={{ flex: 1 }}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        )}

        <ImageViewerModal
          visible={selectedImage !== null}
          imageUrl={selectedImage ?? ''}
          onClose={() => setSelectedImage(null)}
        />
      </View>
    );
  }

  // ── Main Form ────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        <Text style={styles.headerSub}>Documenta el hallazgo en campo</Text>
      </View>

      {/* Título */}
      <View style={styles.card}>
        <Text style={styles.label}>  Título <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej. Mancha en hojas de maíz"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Descripción */}
      <View style={styles.card}>
        <Text style={styles.label}>  Descripción <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Detalles del hallazgo, síntomas observados…"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Cultivo selector */}
      <View style={styles.card}>
        <Text style={styles.label}>  Cultivo <Text style={styles.required}>*</Text></Text>
        {cultivosLoading ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : (
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={cultivoId}
              onValueChange={(value: number) => setCultivoId(value)}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona un cultivo..." value={0} color="#94a3b8" />
              {cultivos.map((c) => (
                <Picker.Item key={c.id} label={c.nombre} value={c.id} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* Ubicación */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>  Ubicación</Text>
          <View style={[styles.statusDot, { backgroundColor: locationReady ? '#10b981' : locationError ? '#ef4444' : '#f59e0b' }]} />
        </View>
        <Text style={styles.coordText}>
          {locationReady
            ? `${latitud?.toFixed(6)}, ${longitud?.toFixed(6)}`
            : locationError
            ? 'No disponible. Toca actualizar.'
            : 'Obteniendo ubicación…'}
        </Text>
        <Pressable
          style={[styles.btnSecondary, locationLoading && styles.btnDisabled]}
          onPress={getLocation}
          disabled={locationLoading}
        >
          <Text style={styles.btnSecondaryText}>
            {locationLoading ? 'Obteniendo…' : '↺  Obtener ubicación'}
          </Text>
        </Pressable>
      </View>

      {/* Imágenes */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>  Fotos</Text>
          <Text style={styles.counter}>{imageUris.length}/10</Text>
        </View>

        <ImageGallery uris={imageUris} onDelete={deleteImage} onPress={(i) => setSelectedImage(imageUris[i])} />

        <Pressable
          style={[styles.btnPrimary, !canTakeMore && styles.btnDisabled]}
          onPress={openCamera}
          disabled={!canTakeMore}
        >
          <Text style={styles.btnPrimaryText}>
            {canTakeMore ? '  Tomar foto' : ' Límite alcanzado'}
          </Text>
        </Pressable>
      </View>

      {/* Audio */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="mic-outline" size={16} color="#64748b" />
            <Text style={styles.label}>Audio</Text>
          </View>
          {audioUri && !isRecording && (
            <Pressable onPress={deleteAudio} style={styles.deleteAudioBtn}>
              <Text style={styles.deleteAudioText}>Eliminar</Text>
            </Pressable>
          )}
        </View>

        {/* Waveform */}
        <RecordingWave isRecording={isRecording} />

        {/* Status text */}
        {isRecording ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
            <Ionicons name="radio-button-on" size={16} color="#ef4444" />
            <Text style={[styles.audioStatus, styles.audioStatusRecording, { marginBottom: 0 }]}> Grabando… {timer}</Text>
          </View>
        ) : audioUri ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
            <Ionicons name="checkmark" size={16} color="#10b981" />
            <Text style={[styles.audioStatus, { marginBottom: 0 }]}> Audio listo</Text>
          </View>
        ) : (
          <Text style={styles.audioStatus}>Sin grabación</Text>
        )}

        {/* WhatsApp-style record button */}
        <View style={styles.recordBtnWrapper}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <Ionicons name="mic" size={24} color="#64748b" />
              )}
            </Pressable>
          </Animated.View>
          <Text style={styles.recordBtnLabel}>
            {isRecording ? 'Toca para detener' : audioUri ? 'Volver a grabar' : 'Toca para grabar'}
          </Text>
        </View>
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.btnSubmit, isSaving && styles.btnDisabled]}
        onPress={saveOfflineAndSync}
        disabled={isSaving}
      >
        <Text style={styles.btnSubmitText}>
          {isSaving ? 'Guardando…' : '  Guardar y enviar reporte'}
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />

      <ImageViewerModal
        visible={selectedImage !== null}
        imageUrl={selectedImage ?? ''}
        onClose={() => setSelectedImage(null)}
      />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { padding: 16 },

  header: { marginBottom: 20, paddingTop: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 2 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  required: { color: '#ef4444' },
  optional: { color: '#94a3b8', fontWeight: '400' },

  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  inputMultiline: { minHeight: 90 },

  statusDot: { width: 10, height: 10, borderRadius: 5 },
  pickerWrap: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    backgroundColor: '#f8fafc', overflow: 'hidden',
  },
  picker: { height: 50, color: '#0f172a' },
  coordText: { fontSize: 13, color: '#475569', fontVariant: ['tabular-nums'], marginBottom: 10 },
  counter: { fontSize: 13, fontWeight: '600', color: '#10b981' },

  btnPrimary: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  btnSecondary: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSecondaryText: { color: '#10b981', fontWeight: '600', fontSize: 14 },

  btnDisabled: { opacity: 0.45 },

  btnSubmit: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },

  // Gallery
  gallery: { marginBottom: 12 },
  galleryItem: { width: 90, height: 90, marginRight: 8, borderRadius: 10, overflow: 'hidden' },
  galleryThumb: { width: 90, height: 90 },
  galleryDelete: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  galleryBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(16,185,129,0.85)',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6,
  },
  galleryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Audio
  waveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, gap: 3, marginVertical: 8 },
  waveBar: { width: 3, height: 28, borderRadius: 3 },
  audioStatus: { textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 12 },
  audioStatusRecording: { color: '#ef4444', fontWeight: '600' },
  recordBtnWrapper: { alignItems: 'center', gap: 8 },
  recordBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  recordBtnActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  stopIcon: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#fff' },
  recordBtnLabel: { fontSize: 12, color: '#64748b' },
  deleteAudioBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  deleteAudioText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraFrame: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  cameraControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 48, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraCounter: { color: '#fff', fontSize: 14, fontWeight: '600', width: 40, textAlign: 'center' },
  cameraShutter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    padding: 4, alignItems: 'center', justifyContent: 'center',
  },
  cameraShutterInner: { flex: 1, borderRadius: 32, backgroundColor: '#fff' },
  cameraCancelBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Preview Modal
  previewContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
  previewImageZoom: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.5 },
  zoomContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  zoomCloseBtn: {
    position: 'absolute', top: 50, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewHint: {
    position: 'absolute', top: 60,
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
  },
  previewHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  previewActions: {
    position: 'absolute', bottom: 60, left: 24, right: 24,
    flexDirection: 'row', gap: 12,
  },
  previewBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  previewBtnPrimary: { backgroundColor: '#10b981' },
  previewBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  previewBtnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 16 },
  previewBtnTextSecondary: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

const wizardStyles = StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: '#15803d',
  },
  stepNum: {
    fontWeight: '800',
    fontSize: 15,
    color: '#94a3b8',
  },
  stepNumActive: {
    color: '#fff',
  },
  stepLine: {
    position: 'absolute',
    top: 37,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  cultivoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cultivoCardSelected: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  cultivoLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
});