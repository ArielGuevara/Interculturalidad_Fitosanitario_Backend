export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN';
}

export interface AuthResponse {
    accessToken: string;
    usuario: Usuario;
}
