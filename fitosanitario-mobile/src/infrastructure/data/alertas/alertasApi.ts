import { apiClient } from '../../http/apiClient';
import { Alerta, Notificacion } from '../../../domain/alertas/types';

export async function getAlertas(): Promise<Alerta[]> {
  const res = await apiClient.get('/alertas');
  return res.data;
}

export async function getAlertaById(id: number): Promise<Alerta> {
  const res = await apiClient.get(`/alertas/${id}`);
  return res.data;
}

export async function marcarAlertaLeida(id: number): Promise<Alerta> {
  const res = await apiClient.patch(`/alertas/${id}/leida`);
  return res.data;
}

export async function getNotificaciones(usuarioId: number): Promise<Notificacion[]> {
  const res = await apiClient.get(`/usuarios/${usuarioId}/notificaciones`);
  return res.data;
}

export async function marcarNotificacionLeida(id: number): Promise<Notificacion> {
  const res = await apiClient.patch(`/notificaciones/${id}/leida`);
  return res.data;
}

export async function countNotificacionesNoLeidas(usuarioId: number): Promise<number> {
  const res = await apiClient.get(`/usuarios/${usuarioId}/notificaciones/no-leidas`);
  return res.data;
}

export async function registrarDispositivo(token: string, plataforma: string): Promise<void> {
  await apiClient.post('/dispositivos', { token, plataforma });
}

export async function eliminarDispositivo(token: string): Promise<void> {
  await apiClient.delete('/dispositivos', { data: { token } });
}
