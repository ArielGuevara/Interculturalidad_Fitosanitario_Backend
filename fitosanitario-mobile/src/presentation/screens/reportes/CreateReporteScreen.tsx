import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { CameraView, type CameraViewRef, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { enqueueReporte } from '../../../infrastructure/offline/pendingReportes';
import { syncPendingReportes } from '../../../infrastructure/offline/sync';

function ensureDocDir() {
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
}

async function ensureMediaDir() {
  const base = ensureDocDir();
  if (!base) return '';
  const dir = `${base}media/`;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {
    // If it already exists or cannot be created, we still try to use base.
  }
  return dir;
}

async function persistUri(fromUri: string, filename: string) {
  const mediaDir = await ensureMediaDir();
  if (!mediaDir) return fromUri;
  const dest = `${mediaDir}${filename}`;
  await FileSystem.copyAsync({ from: fromUri, to: dest });
  return dest;
}

export function CreateReporteScreen() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cultivoId, setCultivoId] = useState('');

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const [cameraMode, setCameraMode] = useState(false);
  const cameraRef = useRef<CameraViewRef>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const canTakeMore = imageUris.length < 10;

  const locationReady = useMemo(() => latitud !== null && longitud !== null, [latitud, longitud]);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita ubicación para crear reportes.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setLatitud(pos.coords.latitude);
    setLongitud(pos.coords.longitude);
  };

  useEffect(() => {
    void getLocation();
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
    if (!cameraRef.current) {
      Alert.alert('Cámara', 'La cámara no está lista todavía.');
      return;
    }
    if (!canTakeMore) {
      Alert.alert('Límite', 'Máximo 10 imágenes.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) {
        Alert.alert('Cámara', 'No se pudo obtener la foto.');
        return;
      }

      const ext = photo.uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
      const filename = `reporte_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      const persisted = await persistUri(photo.uri, filename);

      setImageUris((prev) => [...prev, persisted]);
      setCameraMode(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo tomar la foto');
    }
  };

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

      if (!uri) {
        Alert.alert('Audio', 'No se pudo obtener el archivo de audio.');
        return;
      }

      const filename = `audio_${Date.now()}.m4a`;
      const persisted = await persistUri(uri, filename);
      setAudioUri(persisted);
    } catch (e: any) {
      setRecording(null);
      Alert.alert('Error', e?.message || 'No se pudo detener la grabación');
    }
  };

  const saveOfflineAndSync = async () => {
    if (!titulo.trim()) {
      Alert.alert('Falta información', 'Título es obligatorio');
      return;
    }
    const cultivoIdNum = Number(cultivoId);
    if (!Number.isInteger(cultivoIdNum) || cultivoIdNum <= 0) {
      Alert.alert('Falta información', 'cultivoId debe ser un entero');
      return;
    }
    if (!locationReady || latitud === null || longitud === null) {
      Alert.alert('Falta información', 'Ubicación no disponible');
      return;
    }

    const pending = await enqueueReporte({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() ? descripcion.trim() : undefined,
      cultivoId: cultivoIdNum,
      latitud,
      longitud,
      imageUris,
      audioUri: audioUri ?? undefined,
    });

    try {
      const result = await syncPendingReportes();
      Alert.alert('Reporte', `Guardado (id local: ${pending.id}).\nEnviados: ${result.synced}, fallidos: ${result.failed}`);
      setTitulo('');
      setDescripcion('');
      setCultivoId('');
      setImageUris([]);
      setAudioUri(null);
      await getLocation();
    } catch {
      Alert.alert('Reporte', `Guardado offline (id local: ${pending.id}).`);
    }
  };

  if (cameraMode) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View className="p-4">
          <Pressable className="rounded-xl bg-emerald-600 px-4 py-4" onPress={takePhoto}>
            <Text className="text-center font-semibold text-white">Tomar foto</Text>
          </Pressable>
          <Pressable className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-4" onPress={() => setCameraMode(false)}>
            <Text className="text-center font-semibold text-slate-800">Cancelar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-slate-700">Título</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej. Mancha en hojas"
      />

      <Text className="mt-4 text-slate-700">Descripción (opcional)</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Detalles del hallazgo"
        multiline
      />

      <Text className="mt-4 text-slate-700">Cultivo ID</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        value={cultivoId}
        onChangeText={setCultivoId}
        placeholder="Ej. 1"
        keyboardType="number-pad"
      />

      <View className="mt-4 rounded-xl border border-slate-200 p-4">
        <Text className="font-semibold text-slate-900">Ubicación</Text>
        <Text className="mt-1 text-slate-600">
          {locationReady ? `(${latitud}, ${longitud})` : 'No disponible'}
        </Text>
        <Pressable className="mt-3 rounded-xl bg-emerald-600 px-4 py-3" onPress={getLocation}>
          <Text className="text-center font-semibold text-white">Actualizar ubicación</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-xl border border-slate-200 p-4">
        <Text className="font-semibold text-slate-900">Imágenes</Text>
        <Text className="mt-1 text-slate-600">{imageUris.length} / 10</Text>
        <Pressable
          className={`mt-3 rounded-xl bg-emerald-600 px-4 py-3 ${canTakeMore ? '' : 'opacity-50'}`}
          onPress={openCamera}
          disabled={!canTakeMore}
        >
          <Text className="text-center font-semibold text-white">Añadir foto</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-xl border border-slate-200 p-4">
        <Text className="font-semibold text-slate-900">Audio (opcional)</Text>
        <Text className="mt-1 text-slate-600">{audioUri ? 'Grabado' : 'Sin audio'}</Text>
        {!recording ? (
          <Pressable className="mt-3 rounded-xl bg-emerald-600 px-4 py-3" onPress={startRecording}>
            <Text className="text-center font-semibold text-white">Grabar</Text>
          </Pressable>
        ) : (
          <Pressable className="mt-3 rounded-xl bg-red-600 px-4 py-3" onPress={stopRecording}>
            <Text className="text-center font-semibold text-white">Detener</Text>
          </Pressable>
        )}
      </View>

      <Pressable className="mt-6 rounded-xl bg-emerald-600 px-4 py-4" onPress={saveOfflineAndSync}>
        <Text className="text-center font-semibold text-white">Enviar reporte</Text>
      </Pressable>
    </ScrollView>
  );
}