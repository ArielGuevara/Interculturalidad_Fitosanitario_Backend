import { apiClient } from '../../http/apiClient';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';

export const tratamientosApi = {
  getTratamientos: async (): Promise<TratamientoConRelaciones[]> => {
    const { data } = await apiClient.get<TratamientoConRelaciones[]>('/tratamientos');
    return data;
  },

  getTratamientoById: async (id: number): Promise<TratamientoConRelaciones> => {
    const { data } = await apiClient.get<TratamientoConRelaciones>(`/tratamientos/${id}`);
    return data;
  },

  getTratamientoByReporte: async (reporteId: number): Promise<TratamientoConRelaciones | null> => {
    try {
      const tratamientos = await apiClient.get<TratamientoConRelaciones[]>('/tratamientos');
      const encontrado = tratamientos.data.find((t: any) => t.reporteId === reporteId);
      return encontrado || null;
    } catch {
      return null;
    }
  },

  getEnciclopedia: async (desde?: string): Promise<TratamientoConRelaciones[]> => {
    const params = desde ? { desde } : {};
    const { data } = await apiClient.get<TratamientoConRelaciones[]>('/tratamientos/enciclopedia', { params });
    return data;
  },
};
