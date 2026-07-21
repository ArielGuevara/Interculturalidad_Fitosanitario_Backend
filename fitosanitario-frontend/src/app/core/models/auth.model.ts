export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    telefono: string | null;
    rol: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN';
    cargo: string | null;
    activo: boolean;
    permisos: string[];
    fechaRegistro: string;
}

export interface AuthResponse {
    accessToken: string;
    usuario: Usuario;
}
