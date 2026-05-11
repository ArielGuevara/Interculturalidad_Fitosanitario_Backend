import { apiClient } from '../../infrastructure/http/apiClient';
import type { AuthResponse, Rol } from '../../domain/auth/types';

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  nombre: string;
  email: string;
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

