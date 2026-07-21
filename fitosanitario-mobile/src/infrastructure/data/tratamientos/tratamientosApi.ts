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
      const { data } = await apiClient.get<TratamientoConRelaciones>(`/tratamientos/por-reporte/${reporteId}`);
      return data;
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
