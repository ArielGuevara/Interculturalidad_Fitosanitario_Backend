import axios from 'axios';
import type { AuthResponse } from '../../../domain/auth/types';
import { env } from '../../../shared/config/env';

const API_URL = env.apiBaseUrl;

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/auth/login`, credentials);
    return data;
  },

  register: async (userData: {
    nombre: string;
    email: string;
    password: string;
    rol?: 'AGRICULTOR' | 'MODERADOR';
  }): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/auth/register`, userData);
    return data;
  },
};