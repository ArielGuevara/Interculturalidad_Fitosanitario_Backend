export type Rol = 'AGRICULTOR' | 'MODERADOR';

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
};

export type AuthResponse = {
  accessToken: string;
  usuario: Usuario;
};
