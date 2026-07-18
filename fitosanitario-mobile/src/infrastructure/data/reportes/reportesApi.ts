import type { Reporte, CreateReporteInput, HistorialEntry } from '../../../domain/reportes/types';
import { apiClient } from '../../http/apiClient';

export async function fetchReportes(): Promise<Reporte[]> {
  const res = await apiClient.get<Reporte[]>('/reportes');
  return res.data;
}
export const getReportes = fetchReportes;

export async function fetchReporteById(id: number): Promise<Reporte> {
  const res = await apiClient.get<Reporte>(`/reportes/${id}`);
  return res.data;
}
export const getReporteById = fetchReporteById;

export async function getHistorial(id: number): Promise<HistorialEntry[]> {
  const { data } = await apiClient.get<HistorialEntry[]>(`/reportes/${id}/historial`);
  return data;
}

function guessMimeType(uri: string, fallback: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return fallback;
}

export async function createReporteMultipart(
  input: CreateReporteInput,
  accessToken?: string | null,
): Promise<Reporte> {
  const form = new FormData();
  form.append('titulo', input.titulo);
  if (input.descripcion) form.append('descripcion', input.descripcion);
  form.append('cultivoId', String(input.cultivoId));
  form.append('latitud', String(input.latitud));
  form.append('longitud', String(input.longitud));

  input.imageUris.forEach((uri, i) => {
    form.append(
      'images',
      {
        uri,
        name: `image-${i + 1}.jpg`,
        type: guessMimeType(uri, 'image/jpeg'),
      } as any,
    );
  });

  if (input.audioUri) {
    form.append(
      'audio',
      {
        uri: input.audioUri,
        name: 'audio.m4a',
        type: guessMimeType(input.audioUri, 'audio/m4a'),
      } as any,
    );
  }

  const token = accessToken;
  const baseUrl = String(apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/reportes`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return (await res.json()) as Reporte;
}

export async function reEditarReporte(id: number, dto: {
  titulo?: string;
  descripcion?: string;
  cultivoId?: number;
  imagenesUrls?: string[];
  audioUrl?: string;
}): Promise<Reporte> {
  const { data } = await apiClient.patch<Reporte>(`/reportes/${id}/re-editar`, dto);
  return data;
}

export async function getSuspensionActiva(): Promise<{
  id: number;
  motivo: string;
  tipoDuracion: string;
  duracion: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
} | null> {
  try {
    const { data } = await apiClient.get<any>('/reportes/suspension/activa');
    return data;
  } catch {
    return null;
  }
}

export const reportesApi = { getReportes, getReporteById, getHistorial, createReporte: createReporteMultipart, reEditarReporte, getSuspensionActiva };
