import { apiClient } from '../../http/apiClient';
import type { Reporte, CreateReporteInput } from '../../../../domain/reportes/types';

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'application/octet-stream';
}

function filenameFromUri(uri: string, fallback: string) {
  const last = uri.split('/').pop();
  return last && last.trim() ? last : fallback;
}

export const reportesApi = {
  // GET /reportes
  getReportes: async (): Promise<Reporte[]> => {
    const { data } = await apiClient.get<Reporte[]>('/reportes');
    return data;
  },

  // GET /reportes/:id
  getReporteById: async (id: number): Promise<Reporte> => {
    const { data } = await apiClient.get<Reporte>(`/reportes/${id}`);
    return data;
  },

  // POST /reportes (with multipart/form-data)
  createReporte: async (input: CreateReporteInput): Promise<Reporte> => {
    const form = new FormData();

    // Nest expects flat body fields in multipart (CreateReporteDto)
    form.append('titulo', input.titulo);
    if (input.descripcion) form.append('descripcion', input.descripcion);
    form.append('cultivoId', String(input.cultivoId));
    form.append('latitud', String(input.latitud));
    form.append('longitud', String(input.longitud));

    // Append images (up to 10)
    for (const imageUri of input.imageUris) {
      const name = filenameFromUri(imageUri, 'image.jpg');
      const type = guessMimeType(imageUri);
      form.append('images', { uri: imageUri, name, type } as any);
    }

    // Append audio if exists
    if (input.audioUri) {
      const name = filenameFromUri(input.audioUri, 'audio.m4a');
      const type = guessMimeType(input.audioUri);
      form.append('audio', { uri: input.audioUri, name, type } as any);
    }

    // We need to set the Content-Type to multipart/form-data
    // axios will set it automatically if we pass FormData, but we need to override the headers
    const { data } = await apiClient.post<Reporte>('/reportes', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },
};