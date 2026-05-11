import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Usuario, Rol } from '../../domain/auth/types';
import * as authApi from '../../data/auth/authApi';

const STORAGE_TOKEN_KEY = 'fitosanitario.token';
const STORAGE_USER_KEY = 'fitosanitario.user';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  usuario: Usuario | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    nombre: string;
    email: string;
    password: string;
    rol?: Rol;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  accessToken: null,
  usuario: null,

  hydrate: async () => {
    const [token, userJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_TOKEN_KEY),
      AsyncStorage.getItem(STORAGE_USER_KEY),
    ]);

    if (token && userJson) {
      set({
        status: 'authenticated',
        accessToken: token,
        usuario: JSON.parse(userJson) as Usuario,
      });
      return;
    }

    set({ status: 'unauthenticated', accessToken: null, usuario: null });
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.accessToken),
      AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.usuario)),
    ]);
    set({ status: 'authenticated', accessToken: res.accessToken, usuario: res.usuario });
  },

  register: async (params) => {
    const res = await authApi.register({
      nombre: params.nombre,
      email: params.email,
      password: params.password,
      rol: params.rol,
    });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.accessToken),
      AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.usuario)),
    ]);
    set({ status: 'authenticated', accessToken: res.accessToken, usuario: res.usuario });
  },

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_TOKEN_KEY),
      AsyncStorage.removeItem(STORAGE_USER_KEY),
    ]);
    set({ status: 'unauthenticated', accessToken: null, usuario: null });
  },
}));

export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}
