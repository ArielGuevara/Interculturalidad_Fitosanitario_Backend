import { apiClient } from '../../http/apiClient';
import type { Producto, PlagaCultivoPair } from '../../../domain/catalogos/types';

export const getProductos = async (): Promise<Producto[]> => {
  const { data } = await apiClient.get<Producto[]>('/productos');
  return data;
};

export const createProducto = async (data: Omit<Producto, 'id'>): Promise<Producto> => {
  const { data: response } = await apiClient.post<Producto>('/productos', data);
  return response;
};

export const getProductoById = async (id: number): Promise<Producto> => {
  const { data } = await apiClient.get<Producto>(`/productos/${id}`);
  return data;
};

export const updateProducto = async (
  id: number,
  data: Partial<Omit<Producto, 'id'>>
): Promise<Producto> => {
  const { data: response } = await apiClient.patch<Producto>(`/productos/${id}`, data);
  return response;
};

export const deleteProducto = async (id: number): Promise<void> => {
  await apiClient.delete(`/productos/${id}`);
};

export const getAsociaciones = async (): Promise<(PlagaCultivoPair & { productoId: number })[]> => {
  const { data } = await apiClient.get<(PlagaCultivoPair & { productoId: number })[]>('/productos/asociaciones');
  return data;
};

export const getPlagasCultivos = async (id: number): Promise<PlagaCultivoPair[]> => {
  const { data } = await apiClient.get<PlagaCultivoPair[]>(`/productos/${id}/plagas-cultivos`);
  return data;
};

export const setPlagasCultivos = async (id: number, pairs: { plagaId: number; cultivoId: number }[]): Promise<void> => {
  await apiClient.post(`/productos/${id}/plagas-cultivos`, { pairs });
};
