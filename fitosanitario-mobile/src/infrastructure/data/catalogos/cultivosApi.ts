import { apiClient } from '../../http/apiClient';
import type { Cultivo } from '../../../../domain/catalogos/types';

// GET /cultivos
export const getCultivos = async (): Promise<Cultivo[]> => {
  const { data } = await apiClient.get<Cultivo[]>('/cultivos');
  return data;
};

// POST /cultivos (only for MODERADOR)
export const createCultivo = async (data: Omit<Cultivo, 'id'>): Promise<Cultivo> => {
  const { data: response } = await apiClient.post<Cultivo>('/cultivos', data);
  return response;
};

// GET /cultivos/:id
export const getCultivoById = async (id: number): Promise<Cultivo> => {
  const { data } = await apiClient.get<Cultivo>(`/cultivos/${id}`);
  return data;
};

// PATCH /cultivos/:id (only for MODERADOR)
export const updateCultivo = async (
  id: number,
  data: Partial<Omit<Cultivo, 'id'>>
): Promise<Cultivo> => {
  const { data: response } = await apiClient.patch<Cultivo>(`/cultivos/${id}`, data);
  return response;
};

// DELETE /cultivos/:id (only for MODERADOR)
export const deleteCultivo = async (id: number): Promise<void> => {
  await apiClient.delete(`/cultivos/${id}`);
};