import { apiClient } from '../../http/apiClient';
import type { Plaga } from '../../../../domain/catalogos/types';

// GET /plagas
export const getPlagas = async (): Promise<Plaga[]> => {
  const { data } = await apiClient.get<Plaga[]>('/plagas');
  return data;
};

// POST /plagas (only for MODERADOR)
export const createPlaga = async (data: Omit<Plaga, 'id'>): Promise<Plaga> => {
  const { data: response } = await apiClient.post<Plaga>('/plagas', data);
  return response;
};

// GET /plagas/:id
export const getPlagaById = async (id: number): Promise<Plaga> => {
  const { data } = await apiClient.get<Plaga>(`/plagas/${id}`);
  return data;
};

// PATCH /plagas/:id (only for MODERADOR)
export const updatePlaga = async (
  id: number,
  data: Partial<Omit<Plaga, 'id'>>
): Promise<Plaga> => {
  const { data: response } = await apiClient.patch<Plaga>(`/plagas/${id}`, data);
  return response;
};

// DELETE /plagas/:id (only for MODERADOR)
export const deletePlaga = async (id: number): Promise<void> => {
  await apiClient.delete(`/plagas/${id}`);
};