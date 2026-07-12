import { apiClient } from '../../http/apiClient';
import type { TratamientoConRelaciones } from '../../../domain/tratamientos/types';

export const getTratamientos = async (): Promise<TratamientoConRelaciones[]> => {
  const { data } = await apiClient.get<TratamientoConRelaciones[]>('/tratamientos');
  return data;
};
