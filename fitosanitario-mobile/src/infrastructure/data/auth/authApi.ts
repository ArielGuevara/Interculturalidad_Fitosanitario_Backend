import { apiClient } from '../../http/apiClient';
import type { AuthResponse, Rol } from '../../../domain/auth/types';

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  nombre: string;
  email: string;
  telefono?: string;
  password: string;
  rol?: Rol;
};

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', dto);
  return res.data;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', dto);
  return res.data;
}

export async function requestReset(telefono: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/auth/request-reset', { telefono });
  return res.data;
}

export async function verifyReset(telefono: string, codigo: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/auth/verify-reset', { telefono, codigo });
  return res.data;
}

export async function resetPassword(telefono: string, codigo: string, newPassword: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/auth/reset-password', { telefono, codigo, newPassword });
  return res.data;
}
