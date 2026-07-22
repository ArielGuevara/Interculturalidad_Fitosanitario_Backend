import { apiClient } from '../../http/apiClient';
import type { Recomendacion, CreateRecomendacionInput, Valoracion, ComentarioForo, SaberAncestral } from '../../../domain/recomendaciones/types';

export const recomendacionesApi = {
  getAll: async (filtros?: { tipo?: string; cultivoId?: number; plagaId?: number }): Promise<Recomendacion[]> => {
    const params: any = { moderado: 'true' };
    if (filtros?.tipo) params.tipo = filtros.tipo;
    if (filtros?.cultivoId) params.cultivoId = filtros.cultivoId;
    if (filtros?.plagaId) params.plagaId = filtros.plagaId;
    const { data } = await apiClient.get<Recomendacion[]>('/recomendaciones', { params });
    return data;
  },

  getAllSaberes: async (filtros?: { q?: string; cultivoId?: number }): Promise<SaberAncestral[]> => {
    const params: any = {};
    if (filtros?.q) params.q = filtros.q;
    if (filtros?.cultivoId) params.cultivoId = filtros.cultivoId;
    const { data } = await apiClient.get<SaberAncestral[]>('/recomendaciones/saberes-ancestrales', { params });
    return data;
  },

  getMisRecomendaciones: async (): Promise<Recomendacion[]> => {
    const { data } = await apiClient.get<Recomendacion[]>('/recomendaciones/mis-recomendaciones');
    return data;
  },

  getById: async (id: number): Promise<Recomendacion> => {
    const { data } = await apiClient.get<Recomendacion>(`/recomendaciones/${id}`);
    return data;
  },

  create: async (input: CreateRecomendacionInput): Promise<Recomendacion> => {
    const { data } = await apiClient.post<Recomendacion>('/recomendaciones', input);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/recomendaciones/${id}`);
  },

  deleteComentario: async (comentarioId: number): Promise<void> => {
    await apiClient.delete(`/comentarios/${comentarioId}`);
  },

  valorar: async (recomendacionId: number, puntuacion: number, comentario?: string) => {
    const { data } = await apiClient.post(`/recomendaciones/${recomendacionId}/valorar`, {
      puntuacion,
      comentario: comentario || undefined,
    });
    return data;
  },

  getMiValoracion: async (recomendacionId: number): Promise<{ puntuacion: number | null }> => {
    const { data } = await apiClient.get<{ puntuacion: number | null }>(`/recomendaciones/${recomendacionId}/mi-valoracion`);
    return data;
  },

  getValoraciones: async (recomendacionId: number): Promise<Valoracion[]> => {
    const { data } = await apiClient.get<Valoracion[]>(`/recomendaciones/${recomendacionId}/valoraciones`);
    return data;
  },

  getComentarios: async (recomendacionId: number): Promise<ComentarioForo[]> => {
    const { data } = await apiClient.get<ComentarioForo[]>(`/recomendaciones/${recomendacionId}/comentarios`);
    return data;
  },

  createComentario: async (recomendacionId: number, contenido: string, comentarioPadreId?: number): Promise<ComentarioForo> => {
    const { data } = await apiClient.post<ComentarioForo>(`/recomendaciones/${recomendacionId}/comentarios`, {
      contenido,
      comentarioPadreId: comentarioPadreId || undefined,
    });
    return data;
  },

  createComentarioWithAudio: async (recomendacionId: number, contenido: string, audioUri: string, comentarioPadreId?: number): Promise<ComentarioForo> => {
    const formData = new FormData();
    formData.append('contenido', contenido);
    if (comentarioPadreId) formData.append('comentarioPadreId', String(comentarioPadreId));
    formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'comentario.m4a' } as any);
    const { data } = await apiClient.post<ComentarioForo>(`/recomendaciones/${recomendacionId}/comentarios/with-audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  createComentarioWithImage: async (recomendacionId: number, contenido: string, imageUri: string, comentarioPadreId?: number): Promise<ComentarioForo> => {
    const formData = new FormData();
    formData.append('contenido', contenido);
    if (comentarioPadreId) formData.append('comentarioPadreId', String(comentarioPadreId));
    formData.append('imagen', { uri: imageUri, type: 'image/jpeg', name: 'foto.jpg' } as any);
    const { data } = await apiClient.post<ComentarioForo>(`/recomendaciones/${recomendacionId}/comentarios/with-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
