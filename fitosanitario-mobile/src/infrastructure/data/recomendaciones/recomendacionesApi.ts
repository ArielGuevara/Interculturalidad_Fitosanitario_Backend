import { apiClient } from '../../http/apiClient';
import type { Recomendacion, CreateRecomendacionInput, Valoracion, ComentarioForo } from '../../../domain/recomendaciones/types';

export const recomendacionesApi = {
  getAll: async (filtros?: { tipo?: string; cultivoId?: number; plagaId?: number }): Promise<Recomendacion[]> => {
    const params: any = {};
    if (filtros?.tipo) params.tipo = filtros.tipo;
    if (filtros?.cultivoId) params.cultivoId = filtros.cultivoId;
    if (filtros?.plagaId) params.plagaId = filtros.plagaId;
    const { data } = await apiClient.get<Recomendacion[]>('/recomendaciones', { params });
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

  valorar: async (recomendacionId: number, puntuacion: number, comentario?: string) => {
    const { data } = await apiClient.post(`/recomendaciones/${recomendacionId}/valorar`, {
      puntuacion,
      comentario: comentario || undefined,
    });
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
};
