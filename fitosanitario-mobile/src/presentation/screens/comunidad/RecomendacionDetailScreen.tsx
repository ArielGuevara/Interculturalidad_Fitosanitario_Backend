import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Alert, Image, ScrollView, Text, View, StyleSheet,
  ActivityIndicator, TextInput, Platform,
  Pressable, Keyboard, TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import { fixMediaUrl } from '../../../shared/utils/mediaUrl';
import type { Recomendacion, ComentarioForo } from '../../../domain/recomendaciones/types';
import { useAuthStore } from '../../../infrastructure/auth/authStore';

type Props = NativeStackScreenProps<AppStackParamList, 'RecomendacionDetail'>;

const COLORS = {
  primary: '#059669',
  primaryLight: '#d1fae5',
  ownBubble: '#d1fae5',
  otherBubble: '#fff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  bg: '#e8f5e9',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día(s)`;
  return new Date(dateStr).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

// ── Chat Bubble ──
function ChatBubble({
  comentario,
  isOwn,
  replyContent,
  replyAuthor,
  onReply,
  onLongPress,
  playingAudio,
  onPlayAudio,
  audioProgress,
}: {
  comentario: ComentarioForo;
  isOwn: boolean;
  replyContent?: string;
  replyAuthor?: string;
  onReply: () => void;
  onLongPress: () => void;
  playingAudio: boolean;
  onPlayAudio: () => void;
  audioProgress: number;
}) {
  const isModerator = (comentario as any).esModerador;

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[
        styles.bubbleWrapper,
        isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther,
      ]}
    >
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {/* Nombre del autor (solo para otros) */}
        {!isOwn && (
          <Text style={styles.bubbleAuthor}>{comentario.usuario.nombre}</Text>
        )}

        {/* Moderator badge */}
        {isModerator && (
          <View style={styles.moderatorBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#059669" />
            <Text style={styles.moderatorBadgeText}>Comentario verificado</Text>
          </View>
        )}

        {/* Reply reference */}
        {replyContent && (
          <View style={styles.replyRef}>
            <View style={styles.replyRefLine} />
            <View style={styles.replyRefContent}>
              <Text style={styles.replyRefAuthor}>
                {comentario.comentarioPadreId ? `Respondiendo a ${replyAuthor || ''}` : ''}
              </Text>
              <Text style={styles.replyRefText} numberOfLines={2}>
                {replyContent}
              </Text>
            </View>
          </View>
        )}

        {/* Image */}
        {comentario.imagenUrl ? (
          <Image source={{ uri: fixMediaUrl(comentario.imagenUrl)! }} style={styles.bubbleImage} resizeMode="cover" />
        ) : null}

        {/* Contenido */}
        {comentario.contenido ? (
          <Text style={styles.bubbleText}>{comentario.contenido}</Text>
        ) : null}

        {/* Audio */}
        {comentario.audioUrl ? (
          <Pressable onPress={onPlayAudio} style={styles.audioBubble}>
            <Ionicons
              name={playingAudio ? 'pause-circle' : 'play-circle'}
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.audioProgressBar}>
              <View style={[styles.audioProgressFill, { width: playingAudio ? `${audioProgress}%` : '0%' }]} />
            </View>
            <Ionicons name="volume-high" size={14} color="#64748b" />
          </Pressable>
        ) : null}

        {/* Footer: hora + reply */}
        <View style={[styles.bubbleFooter, isOwn && styles.bubbleFooterOwn]}>
          <Text style={styles.bubbleTime}>{formatTime(comentario.fechaComentario)}</Text>

        </View>
      </View>

      {/* Reply button */}
      <Pressable onPress={onReply} style={styles.bubbleReplyBtn} hitSlop={8}>
        <Ionicons name="arrow-undo" size={14} color={COLORS.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

// ── Skeleton loading ──
function SkeletonBubble({ isOwn }: { isOwn: boolean }) {
  return (
    <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
      <View style={[styles.skeletonBubble, isOwn && { backgroundColor: '#e2e8f0' }]}>
        {!isOwn && <View style={styles.skeletonAuthor} />}
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
      </View>
    </View>
  );
}

export function RecomendacionDetailScreen({ route }: Props) {
  const { id } = route.params;
  const usuario = useAuthStore((s) => s.usuario);
  const scrollRef = useRef<ScrollView>(null);

  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioForo[]>([]);
  const [loading, setLoading] = useState(true);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string; contenido: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioPreviewProgress, setAudioPreviewProgress] = useState(0);
  const [audioPreviewDuration, setAudioPreviewDuration] = useState(0);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build flat comments list with reply content
  const [flatComments, setFlatComments] = useState<(ComentarioForo & { replyContent?: string; replyAuthor?: string })[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [rec, comentariosData] = await Promise.all([
        recomendacionesApi.getById(id),
        recomendacionesApi.getComentarios(id),
      ]);
      setRecomendacion(rec);

      // Build map of id→content + author for replies
      const contentMap = new Map<number, { contenido: string; username: string }>();
      const flat: (ComentarioForo & { replyContent?: string; replyAuthor?: string })[] = [];
      const addFlat = (c: ComentarioForo) => {
        contentMap.set(c.id, { contenido: c.contenido || c.audioUrl || '', username: c.usuario.nombre });
        const parent = c.comentarioPadreId ? contentMap.get(c.comentarioPadreId) : undefined;
        flat.push({ ...c, replyContent: parent?.contenido, replyAuthor: parent?.username });
        if (c.respuestas) c.respuestas.forEach(addFlat);
      };
      comentariosData.forEach(addFlat);
      setComentarios(comentariosData);
      setFlatComments(flat);
    } catch (e) {
      console.error('Error cargando recomendación:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    return () => { stopTimer(); };
  }, []);

  // Polling for live comments
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const comentariosData = await recomendacionesApi.getComentarios(id);
        const contentMap = new Map<number, { contenido: string; username: string }>();
        const flat: (ComentarioForo & { replyContent?: string; replyAuthor?: string })[] = [];
        const addFlat = (c: ComentarioForo) => {
          contentMap.set(c.id, { contenido: c.contenido || c.audioUrl || '', username: c.usuario.nombre });
          const parent = c.comentarioPadreId ? contentMap.get(c.comentarioPadreId) : undefined;
          flat.push({ ...c, replyContent: parent?.contenido, replyAuthor: parent?.username });
          if (c.respuestas) c.respuestas.forEach(addFlat);
        };
        comentariosData.forEach(addFlat);
        setComentarios(comentariosData);
        setFlatComments(flat);
      } catch { /* silent */ }
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (!loading && flatComments.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [flatComments.length, loading]);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permiso', 'Se necesita permiso para grabar audio'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch { Alert.alert('Error', 'No se pudo iniciar la grabación'); }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
      stopTimer();
    } catch { Alert.alert('Error', 'No se pudo pausar la grabación'); }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      setIsPaused(false);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch { Alert.alert('Error', 'No se pudo reanudar la grabación'); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    } catch { Alert.alert('Error', 'No se pudo detener la grabación'); }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const playPreviewAudio = async () => {
    if (!audioUri) return;
    try {
      if (isPlayingPreview) {
        await soundRef.current?.pauseAsync();
        setIsPlayingPreview(false);
      } else {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setIsPlayingPreview(true);
        if (status.isLoaded && status.durationMillis) {
          setAudioPreviewDuration(Math.floor(status.durationMillis / 1000));
        }
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded) {
            setAudioPreviewProgress(s.positionMillis / (s.durationMillis || 1) * 100);
            if (s.didJustFinish) {
              setIsPlayingPreview(false);
              setAudioPreviewProgress(0);
            }
          }
        });
      }
    } catch (err) {
      console.log('Error playing preview:', err);
    }
  };

  const playAudio = async (comentario: ComentarioForo) => {
    if (!comentario.audioUrl) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      if (playingAudioId === comentario.id) {
        setPlayingAudioId(null);
        setAudioProgress(0);
        return;
      }
      setPlayingAudioId(comentario.id);
      setAudioProgress(0);
      const { sound } = await Audio.Sound.createAsync(
        { uri: fixMediaUrl(comentario.audioUrl)! },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.durationMillis) setAudioProgress(status.positionMillis / status.durationMillis * 100);
          if (!status.isPlaying && status.didJustFinish) {
            setPlayingAudioId(null);
            setAudioProgress(0);
            sound.unloadAsync();
            soundRef.current = null;
          }
        }
      });
    } catch { Alert.alert('Error', 'No se pudo reproducir el audio'); }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.[0]) {
      setImagenUri(result.assets[0].uri ?? null);
    }
  };

  const takePhoto = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.[0]) {
      setImagenUri(result.assets[0].uri ?? null);
    }
  };

  const handleEnviarComentario = async () => {
    if ((!nuevoComentario.trim() && !audioUri && !imagenUri) || enviandoComentario) return;
    try {
      setEnviandoComentario(true);
      if (audioUri) {
        await recomendacionesApi.createComentarioWithAudio(id, nuevoComentario.trim(), audioUri, replyTo?.id);
      } else if (imagenUri) {
        await recomendacionesApi.createComentarioWithImage(id, nuevoComentario.trim(), imagenUri, replyTo?.id);
      } else {
        await recomendacionesApi.createComentario(id, nuevoComentario.trim(), replyTo?.id);
      }
      setNuevoComentario('');
      setReplyTo(null);
      setAudioUri(null);
      setImagenUri(null);
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar el comentario');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const iniciarReply = (comentario: ComentarioForo) => {
    setReplyTo({ id: comentario.id, username: comentario.usuario.nombre, contenido: comentario.contenido || '' });
  };

  const cancelarReply = () => { setReplyTo(null); };

  const handleLongPress = (comentario: ComentarioForo) => {
    const isOwn = comentario.usuario.id === usuario?.id;
    if (!isOwn) return;
    Alert.alert(
      'Eliminar comentario',
      'Esta acción eliminará el comentario para todos los usuarios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await recomendacionesApi.deleteComentario(comentario.id);
              await loadData();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el comentario');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSkeleton} />
        </View>
        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          <SkeletonBubble isOwn={false} />
          <SkeletonBubble isOwn={false} />
          <SkeletonBubble isOwn={true} />
          <SkeletonBubble isOwn={false} />
        </ScrollView>
      </View>
    );
  }

  if (!recomendacion) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#64748b' }}>Recomendación no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* ── Fixed Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {recomendacion.titulo}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerAuthor}>
              {recomendacion.usuario?.nombre || 'Anónimo'}
            </Text>
            <Text style={styles.headerDot}>·</Text>
            <Text style={styles.headerDate}>
              {formatRelativeTime(recomendacion.createdAt)}
            </Text>
          </View>
          {recomendacion.descripcion ? (
            <Text style={styles.headerDesc} numberOfLines={3}>
              {recomendacion.descripcion}
            </Text>
          ) : null}
          {recomendacion.imagenUrl && (
            <Image
              source={{ uri: fixMediaUrl(recomendacion.imagenUrl)! }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          )}
          {recomendacion.cultivo || recomendacion.plaga ? (
            <View style={styles.headerTags}>
              {recomendacion.cultivo && (
                <Text style={styles.headerTag}>
                  <Ionicons name="leaf" size={11} color="#16a34a" /> {recomendacion.cultivo.nombre}
                </Text>
              )}
              {recomendacion.plaga && (
                <Text style={[styles.headerTag, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
                  <Ionicons name="bug" size={11} color="#dc2626" /> {recomendacion.plaga.nombre}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Chat Area ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {flatComments.length > 0 ? (
            flatComments.map((c) => (
              <ChatBubble
                key={c.id}
                comentario={c}
                isOwn={c.usuario.id === usuario?.id}
                replyContent={c.replyContent}
                replyAuthor={c.replyAuthor}
                onReply={() => iniciarReply(c)}
                onLongPress={() => handleLongPress(c)}
                playingAudio={playingAudioId === c.id}
                onPlayAudio={() => playAudio(c)}
                audioProgress={audioProgress}
              />
            ))
          ) : (
            <View style={styles.emptyChat}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Todavía no existen comentarios</Text>
              <Text style={styles.emptyText}>
                Sé el primero en compartir una experiencia{'\n'}que pueda ayudar a otros agricultores.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── WhatsApp-style Input Bar ── */}
        <View style={[styles.inputBar, { paddingBottom: keyboardHeight || (Platform.OS === 'ios' ? 24 : 8) }]}>
          {replyTo && (
            <View style={styles.replyIndicator}>
              <View style={styles.replyIndicatorLine} />
              <View style={styles.replyIndicatorContent}>
                <Text style={styles.replyIndicatorAuthor} numberOfLines={1}>
                  {replyTo.username}
                </Text>
                <Text style={styles.replyIndicatorText} numberOfLines={1}>
                  {replyTo.contenido}
                </Text>
              </View>
              <Pressable onPress={cancelarReply} hitSlop={8}>
                <Ionicons name="close" size={18} color="#94a3b8" />
              </Pressable>
            </View>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <View style={styles.recordingBar}>
              <View style={styles.recordingDotLive}>
                <View style={styles.recordingDotInner} />
              </View>
              <Text style={styles.recordingTimer}>{formatTimer(recordingTime)}</Text>
              <Text style={styles.recordingStatus}>{isPaused ? 'En pausa' : 'Grabando...'}</Text>
              {audioUri && (
                <Pressable onPress={stopRecording} style={styles.recordingSendBtn}>
                  <Ionicons name="send" size={14} color="#fff" />
                </Pressable>
              )}
            </View>
          )}

          {/* Audio preview ABOVE input */}
          {audioUri && !isRecording && (
            <View style={styles.mediaPreviewRow}>
              <View style={styles.audioPreviewContainer}>
                <TouchableOpacity onPress={() => setAudioUri(null)} style={styles.audioCancelBtn}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={playPreviewAudio} style={styles.audioPlayBtn}>
                  <Ionicons name={isPlayingPreview ? 'pause-circle' : 'play-circle'} size={28} color="#16a34a" />
                </TouchableOpacity>
                <View style={styles.audioWaveProgress}>
                  <View style={[styles.audioWaveFill, { width: `${audioPreviewProgress}%` }]} />
                </View>
                <Text style={styles.audioDurationText}>{formatTimer(audioPreviewDuration)}</Text>
              </View>
            </View>
          )}

          {/* Image preview ABOVE input */}
          {imagenUri && !audioUri && (
            <View style={styles.mediaPreviewRow}>
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imagenUri }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setImagenUri(null)} style={styles.imageCancelBtn}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Mic button */}
            {isRecording ? (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Pressable style={styles.micBtnSmall} onPress={isPaused ? resumeRecording : pauseRecording}>
                  <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color="#fff" />
                </Pressable>
                <Pressable style={[styles.micBtnSmall, { backgroundColor: '#ef4444' }]} onPress={stopRecording}>
                  <Ionicons name="stop" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.micBtn]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                <Ionicons name="mic" size={20} color="#64748b" />
              </Pressable>
            )}

            {/* Camera/Image button */}
            <Pressable style={styles.imgBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#64748b" />
            </Pressable>

            {/* Text input */}
            <TextInput
              style={styles.inputField}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#94a3b8"
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
            />

            {/* Send button */}
            <Pressable
              style={[styles.sendBtn, (!nuevoComentario.trim() && !audioUri && !imagenUri) && styles.sendBtnDisabled]}
              onPress={handleEnviarComentario}
              disabled={(!nuevoComentario.trim() && !audioUri && !imagenUri) || enviandoComentario}
            >
              {enviandoComentario ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf2' },

  // ── Header ──
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  headerAuthor: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  headerDot: { fontSize: 14, color: '#94a3b8' },
  headerDate: { fontSize: 12, color: '#94a3b8' },
  headerDesc: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 6 },
  headerTags: { flexDirection: 'row', gap: 6 },
  headerTag: { fontSize: 11, color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  headerSkeleton: { height: 60, backgroundColor: '#e2e8f0', borderRadius: 8 },
  headerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },

  // ── Chat Area ──
  chatArea: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 8 },

  // ── Chat Bubbles ──
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    maxWidth: '85%',
  },
  bubbleWrapperOwn: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  bubbleOwn: {
    backgroundColor: COLORS.ownBubble,
    borderBottomRightRadius: 4,
    minWidth: 120,
  },
  bubbleOther: {
    backgroundColor: COLORS.otherBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 120,
  },
  bubbleAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 20,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleFooterOwn: {},
  bubbleTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  bubbleReplyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },

  // Moderator badge
  moderatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  moderatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // Reply reference inside bubble
  replyRef: {
    flexDirection: 'row',
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 6,
  },
  replyRefLine: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyRefContent: { flex: 1 },
  replyRefAuthor: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  replyRefText: { fontSize: 12, color: '#64748b', marginTop: 1 },

  // Audio in bubble
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
  },
  audioProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  audioProgressFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    width: '30%',
  },
  audioDuration: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  // ── Empty state ──
  emptyChat: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', textAlign: 'center', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  // ── Skeleton ──
  skeletonBubble: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 12, width: 200 },
  skeletonAuthor: { height: 10, width: 80, backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 8 },
  skeletonLine: { height: 10, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 6 },

  // ── Input Bar ──
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  replyIndicatorLine: {},
  replyIndicatorContent: { flex: 1, marginLeft: 8 },
  replyIndicatorAuthor: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  replyIndicatorText: { fontSize: 12, color: '#64748b', marginTop: 1 },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  recordingTimer: { fontSize: 13, fontWeight: '700', color: '#ef4444', fontVariant: ['tabular-nums'] },
  recordingStatus: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  recordingDotLive: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  recordingDotInner: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff',
  },
  recordingSendBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#059669',
    alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#fee2e2',
  },
  micBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  // ── Media Preview (above input) ──
  mediaPreviewRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  audioPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    gap: 8,
  },
  audioCancelBtn: {
    padding: 4,
  },
  audioPlayBtn: {
    padding: 4,
  },
  audioWaveProgress: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  audioWaveFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  audioDurationText: {
    fontSize: 12,
    color: '#475569',
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'right',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imageCancelBtn: {
    padding: 4,
  },
  imgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 4,
  },
});
