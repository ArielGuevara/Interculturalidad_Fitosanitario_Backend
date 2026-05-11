import type { Reporte, CreateReporteInput } from '../../domain/reportes/types';
import { apiClient } from '../../infrastructure/http/apiClient';

export async function fetchReportes(): Promise<Reporte[]> {
  const res = await apiClient.get<Reporte[]>('/reportes');
  return res.data;
}

export async function fetchReporteById(id: number): Promise<Reporte> {
  const res = await apiClient.get<Reporte>(`/reportes/${id}`);
  return res.data;
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

  // Usamos fetch para multipart en RN/Expo.
  const token = accessToken;
  const baseUrl = String(apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/reportes`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO seteamos Content-Type: fetch lo asigna con boundary.
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return (await res.json()) as Reporte;
}

