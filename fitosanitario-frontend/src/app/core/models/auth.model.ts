export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'AGRICULTOR' | 'MODERADOR';
}

export interface AuthResponse {
    accessToken: string;
    usuario: Usuario;
}
