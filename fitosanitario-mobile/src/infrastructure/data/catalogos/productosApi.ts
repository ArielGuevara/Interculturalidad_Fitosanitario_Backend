import { apiClient } from '../../http/apiClient';
import type { Producto } from '../../../../domain/catalogos/types';

// GET /productos
export const getProductos = async (): Promise<Producto[]> => {
  const { data } = await apiClient.get<Producto[]>('/productos');
  return data;
};

// POST /productos (only for MODERADOR)
export const createProducto = async (data: Omit<Producto, 'id'>): Promise<Producto> => {
  const { data: response } = await apiClient.post<Producto>('/productos', data);
  return response;
};

// GET /productos/:id
export const getProductoById = async (id: number): Promise<Producto> => {
  const { data } = await apiClient.get<Producto>(`/productos/${id}`);
  return data;
};

// PATCH /productos/:id (only for MODERADOR)
export const updateProducto = async (
  id: number,
  data: Partial<Omit<Producto, 'id'>>
): Promise<Producto> => {
  const { data: response } = await apiClient.patch<Producto>(`/productos/${id}`, data);
  return response;
};

// DELETE /productos/:id (only for MODERADOR)
export const deleteProducto = async (id: number): Promise<void> => {
  await apiClient.delete(`/productos/${id}`);
};