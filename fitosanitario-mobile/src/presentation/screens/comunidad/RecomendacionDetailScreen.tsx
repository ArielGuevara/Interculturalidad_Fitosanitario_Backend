import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Alert, ScrollView, Text, View, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
  Pressable, Keyboard,
} from 'react-native';
import { Audio, AVPlaybackSource } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { recomendacionesApi } from '../../../infrastructure/data/recomendaciones/recomendacionesApi';
import type { Recomendacion, Valoracion, ComentarioForo } from '../../../domain/recomendaciones/types';
import { StarRating } from '../../../shared/components/StarRating';
import { useAuthStore } from '../../../infrastructure/auth/authStore';

type Props = NativeStackScreenProps<AppStackParamList, 'RecomendacionDetail'>;

const TIPO_COLORS: Record<string, string> = {
  RECOMENDACION: '#059669',
  CONSULTA: '#d97706',
  CONOCIMIENTO_ANCESTRAL: '#7c3aed',
};

const TIPO_ICONS: Record<string, any> = {
  RECOMENDACION: 'bulb-outline',
  CONSULTA: 'help-circle-outline',
  CONOCIMIENTO_ANCESTRAL: 'leaf-outline',
};

function ComentarioItem({
  comentario,
  onReply,
  nivel = 0,
}: {
  comentario: ComentarioForo;
  onReply: (id: number, username: string) => void;
  nivel?: number;
}) {
  const hasRespuestas = comentario.respuestas && comentario.respuestas.length > 0;
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playAudio = async () => {
    if (!comentario.audioUrl) return;
    try {
      const { sound: s } = await Audio.Sound.createAsync({ uri: comentario.audioUrl } as AVPlaybackSource);
      setSound(s);
      setPlaying(true);
      s.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying) {
          setPlaying(false);
          s.unloadAsync();
        }
      });
      await s.playAsync();
    } catch { Alert.alert('Error', 'No se pudo reproducir el audio'); }
  };

  return (
    <View style={[styles.comentarioItem, { marginLeft: nivel * 20 }]}>
      <View style={styles.comentarioHeader}>
        <View style={styles.comentarioAvatar}>
          <Ionicons name="person-circle-outline" size={24} color="#10b981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.comentarioAuthor}>{comentario.usuario.nombre}</Text>
          <Text style={styles.comentarioDate}>
            {new Date(comentario.fechaComentario).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.comentarioContenido}>{comentario.contenido}</Text>
      {comentario.audioUrl && (
        <Pressable onPress={playAudio} style={styles.audioPlayBtn}>
          <Ionicons name={playing ? 'volume-high' : 'volume-medium'} size={18} color="#059669" />
          <Text style={styles.audioPlayText}>{playing ? 'Reproduciendo...' : 'Escuchar audio'}</Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => onReply(comentario.id, comentario.usuario.nombre)}
        style={styles.replyBtn}
      >
        <Ionicons name="return-down-back" size={14} color="#059669" />
        <Text style={styles.replyBtnText}>Responder</Text>
      </Pressable>
      {hasRespuestas &&
        comentario.respuestas!.map((r) => (
          <ComentarioItem key={r.id} comentario={r} onReply={onReply} nivel={nivel + 1} />
        ))}
    </View>
  );
}

export function RecomendacionDetailScreen({ route }: Props) {
  const { id } = route.params;
  const usuario = useAuthStore((s) => s.usuario);
  const scrollRef = useRef<ScrollView>(null);
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioForo[]>([]);
  const [loading, setLoading] = useState(true);
  const [miValoracion, setMiValoracion] = useState(0);
  const [comentarioVal, setComentarioVal] = useState('');

  // Comentarios
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);

  // Audio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [rec, vals, comentariosData] = await Promise.all([
        recomendacionesApi.getById(id),
        recomendacionesApi.getValoraciones(id),
        recomendacionesApi.getComentarios(id),
      ]);
      setRecomendacion(rec);
      setValoraciones(vals);

      // Build tree
      const map = new Map<number, ComentarioForo>();
      const roots: ComentarioForo[] = [];
      for (const c of comentariosData) {
        map.set(c.id, { ...c, respuestas: [] });
      }
      for (const c of comentariosData) {
        const node = map.get(c.id)!;
        if (c.comentarioPadreId && map.has(c.comentarioPadreId)) {
          map.get(c.comentarioPadreId)!.respuestas!.push(node);
        } else {
          roots.push(node);
        }
      }
      setComentarios(roots);

      const miVal = vals.find((v: Valoracion) => v.usuario.id === usuario?.id);
      if (miVal) setMiValoracion(miVal.puntuacion);
    } catch (e) {
      console.error('Error cargando recomendación:', e);
    } finally {
      setLoading(false);
    }
  }, [id, usuario?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const handleValorar = async (puntuacion: number) => {
    if (enviandoComentario || miValoracion > 0) return;
    setEnviandoComentario(true);
    try {
      await recomendacionesApi.valorar(id, puntuacion, comentarioVal || undefined);
      const [rec, vals] = await Promise.all([
        recomendacionesApi.getById(id),
        recomendacionesApi.getValoraciones(id),
      ]);
      setRecomendacion(rec);
      setValoraciones(vals);
      setMiValoracion(puntuacion);
      Alert.alert('Gracias', 'Tu valoración ha sido registrada');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo valorar');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch { Alert.alert('Error', 'No se pudo pausar la grabación'); }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEnviarComentario = async () => {
    if ((!nuevoComentario.trim() && !audioUri) || enviandoComentario) return;
    try {
      setEnviandoComentario(true);
      if (audioUri) {
        await recomendacionesApi.createComentarioWithAudio(
          id,
          nuevoComentario.trim(),
          audioUri,
          replyTo?.id || undefined,
        );
      } else {
        await recomendacionesApi.createComentario(
          id,
          nuevoComentario.trim(),
          replyTo?.id || undefined,
        );
      }
      setNuevoComentario('');
      setReplyTo(null);
      setAudioUri(null);
      await loadData();
      // Scroll to bottom after new comment
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar el comentario');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const iniciarReply = (comentarioId: number, username: string) => {
    setReplyTo({ id: comentarioId, username });
    setNuevoComentario(`@${username} `);
  };

  const cancelarReply = () => {
    setReplyTo(null);
    setNuevoComentario('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!recomendacion) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#6b7280' }}>Recomendación no encontrada</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tipo badge */}
        <View style={[styles.tipoBadge, { backgroundColor: (TIPO_COLORS[recomendacion.tipo] || '#6b7280') + '20' }]}>
          <Ionicons name={TIPO_ICONS[recomendacion.tipo] || 'chatbubble-outline'} size={14} color="#10b981" />
          <Text style={[styles.tipoText, { color: TIPO_COLORS[recomendacion.tipo] || '#6b7280' }]}>
            {recomendacion.tipo === 'CONOCIMIENTO_ANCESTRAL' ? 'CONOCIMIENTO ANCESTRAL' : recomendacion.tipo}
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>{recomendacion.titulo}</Text>

        {/* Autor + fecha */}
        <View style={styles.metaRow}>
          <Text style={styles.author}>Por {recomendacion.usuario?.nombre || 'Anónimo'}</Text>
          <Text style={styles.date}>
            {new Date(recomendacion.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Cultivo/Plaga tags */}
        {(recomendacion.cultivo || recomendacion.plaga) && (
          <View style={styles.tagsRow}>
            {recomendacion.cultivo && (
              <Text style={styles.tag}><Ionicons name="leaf" size={12} color="#16a34a" /> {recomendacion.cultivo.nombre}</Text>
            )}
            {recomendacion.plaga && (
              <Text style={[styles.tag, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
                <Ionicons name="bug" size={12} color="#dc2626" /> {recomendacion.plaga.nombre}
              </Text>
            )}
          </View>
        )}

        {/* Descripción */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>{recomendacion.descripcion}</Text>
        </View>

        {/* ── COMENTARIOS SECTION ── */}
        <View style={styles.comentariosSection}>
          <Text style={styles.sectionTitle}>
            Comentarios ({comentarios.length})
          </Text>

          {comentarios.length > 0 ? (
            comentarios.map((c) => (
              <ComentarioItem key={c.id} comentario={c} onReply={iniciarReply} />
            ))
          ) : (
            <Text style={styles.sinComentarios}>No hay comentarios aún. ¡Sé el primero!</Text>
          )}
        </View>

        {/* ── RATING SECTION (al final) ── */}
        <View style={styles.ratingSection}>
          {/* Rating stats */}
          <View style={styles.ratingStats}>
            <StarRating value={recomendacion.valoracionPromedio} readonly size={20} showValue />
            <Text style={styles.ratingCount}>
              {recomendacion.totalValoraciones} valoración(es)
            </Text>
          </View>

          {/* User rating */}
          {miValoracion === 0 ? (
            <View style={styles.valorarCard}>
              <Text style={styles.valorarTitle}>¿Te fue útil esta publicación?</Text>
              <StarRating value={miValoracion} onChange={handleValorar} size={36} />
              <TextInput
                style={styles.commentInput}
                placeholder="Agrega un comentario (opcional)..."
                placeholderTextColor="#94a3b8"
                value={comentarioVal}
                onChangeText={setComentarioVal}
              />
            </View>
          ) : (
            <View style={styles.valorarCard}>
              <Text style={styles.valorarTitle}>Tu valoración: {miValoracion}/5</Text>
              <StarRating value={miValoracion} readonly size={24} />
            </View>
          )}

          {/* Lista de valoraciones */}
          {valoraciones.length > 0 && (
            <View style={styles.valoracionesSection}>
              <Text style={styles.sectionTitle}>Valoraciones</Text>
              {valoraciones.map((v) => (
                <View key={v.id} style={styles.valoracionItem}>
                  <View style={styles.valoracionHeader}>
                    <Text style={styles.valoracionAuthor}>{v.usuario.nombre}</Text>
                    <StarRating value={v.puntuacion} readonly size={14} />
                  </View>
                  {v.comentario && (
                    <Text style={styles.valoracionComment}>{v.comentario}</Text>
                  )}
                  <Text style={styles.valoracionDate}>
                    {new Date(v.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── WHATSAPP-STYLE INPUT BAR (sticky at bottom) ── */}
      <View style={styles.inputBar}>
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Ionicons name="arrow-undo" size={14} color="#059669" />
            <Text style={styles.replyIndicatorText} numberOfLines={1}>
              {replyTo.username}
            </Text>
            <Pressable onPress={cancelarReply} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Ionicons name="radio-button-on" size={14} color="#ef4444" />
            <Text style={styles.recordingTimer}>{formatTime(recordingTime)}</Text>
            <View style={[styles.recordingDot, isPaused && { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.recordingStatus}>{isPaused ? 'En pausa' : 'Grabando...'}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          {isRecording ? (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {isPaused ? (
                <Pressable style={styles.micBtnPause} onPress={resumeRecording}>
                  <Ionicons name="play" size={18} color="#fff" />
                </Pressable>
              ) : (
                <Pressable style={styles.micBtnPause} onPress={pauseRecording}>
                  <Ionicons name="pause" size={18} color="#fff" />
                </Pressable>
              )}
              <Pressable style={styles.micBtnRecording} onPress={stopRecording}>
                <Ionicons name="stop" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : audioUri ? (
            <Pressable style={styles.micBtnDone} onPress={() => setAudioUri(null)}>
              <Ionicons name="checkmark-circle" size={22} color="#10b981" />
            </Pressable>
          ) : (
            <Pressable style={styles.micBtn} onPress={startRecording}>
              <Ionicons name="mic" size={20} color="#059669" />
            </Pressable>
          )}
          <TextInput
            style={styles.inputField}
            placeholder={replyTo ? 'Escribe tu respuesta...' : 'Escribe un comentario...'}
            placeholderTextColor="#94a3b8"
            value={nuevoComentario}
            onChangeText={setNuevoComentario}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!nuevoComentario.trim() && !audioUri) && styles.sendBtnDisabled]}
            onPress={handleEnviarComentario}
            disabled={(!nuevoComentario.trim() && !audioUri) || enviandoComentario}
          >
            {enviandoComentario ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf2' },
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0faf2' },

  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  tipoText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author: { fontSize: 13, color: '#64748b' },
  date: { fontSize: 12, color: '#94a3b8' },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tag: { fontSize: 12, color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  descCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  descText: { fontSize: 15, color: '#334155', lineHeight: 22 },

  // ── Comentarios ──
  comentariosSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  sinComentarios: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
  comentarioItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  comentarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  comentarioAvatar: { marginRight: 4 },
  comentarioAuthor: { fontSize: 13, fontWeight: '600', color: '#374151' },
  comentarioDate: { fontSize: 11, color: '#94a3b8' },
  comentarioContenido: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 6 },
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  audioPlayText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyBtnText: { fontSize: 12, color: '#059669', fontWeight: '600' },

  // ── Rating (al final) ──
  ratingSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  ratingStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingCount: { fontSize: 12, color: '#94a3b8' },
  valorarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    alignItems: 'center',
    gap: 12,
  },
  valorarTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  valoracionesSection: { marginTop: 8 },
  valoracionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  valoracionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  valoracionAuthor: { fontSize: 13, fontWeight: '600', color: '#374151' },
  valoracionComment: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  valoracionDate: { fontSize: 11, color: '#94a3b8' },

  // ── WhatsApp-style Input Bar ──
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 4,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyIndicatorText: { fontSize: 12, color: '#059669', flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  micBtn: {
    backgroundColor: '#f0fdf4',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#d1fae5',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  recordingTimer: { fontSize: 13, fontWeight: '700', color: '#ef4444', fontVariant: ['tabular-nums'] },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  recordingStatus: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  micBtnRecording: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnPause: {
    backgroundColor: '#f59e0b',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnDone: {
    backgroundColor: '#f0fdf4',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#d1fae5',
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#059669',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
