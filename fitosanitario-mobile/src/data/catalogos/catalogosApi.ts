import { apiClient } from '../../infrastructure/http/apiClient';
import type { Cultivo, Plaga, Producto } from '../../domain/catalogos/types';

export async function fetchCultivos(): Promise<Cultivo[]> {
  const res = await apiClient.get<Cultivo[]>('/cultivos');
  return res.data;
}

export async function fetchPlagas(): Promise<Plaga[]> {
  const res = await apiClient.get<Plaga[]>('/plagas');
  return res.data;
}

export async function fetchProductos(): Promise<Producto[]> {
  const res = await apiClient.get<Producto[]>('/productos');
  return res.data;
}

