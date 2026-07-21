export type TipoRecomendacion = 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL';

export interface RecomendacionComunidad {
    id: number;
    reporteId?: number | null;
    titulo: string;
    descripcion: string;
    tipo: TipoRecomendacion;
    valoracionPromedio: number;
    totalValoraciones: number;
    valoracionesBuenas?: number;
    valoracionesMalas?: number;
    miValoracion?: number | null;
    moderado: boolean;
    activo?: boolean;
    createdAt: string;
    usuario?: {
        id: number;
        nombre: string;
    };
    cultivo?: {
        id: number;
        nombre: string;
    } | null;
    plaga?: {
        id: number;
        nombre: string;
    } | null;
    imagenUrl?: string | null;
    // Saber Ancestral fields
    motivoRechazo?: string | null;
    fechaExpiracion?: string | null;
    solucion?: string | null;
    comentarioModerador?: string | null;
}

export interface ComentarioForo {
    id: number;
    comentarioPadreId?: number | null;
    contenido: string;
    audioUrl?: string | null;
    imagenUrl?: string | null;
    fechaComentario: string;
    activo?: boolean;
    esModerador?: boolean;
    usuario?: {
        id: number;
        nombre: string;
    };
    respuestas?: ComentarioForo[];
}

export interface CreateRecomendacionDto {
    reporteId?: number;
    cultivoId?: number;
    plagaId?: number;
    titulo: string;
    descripcion: string;
    tipo: TipoRecomendacion;
}

export interface SaberAncestralFilter {
    q?: string;
    estado?: string;
    cultivoId?: number;
    plagaId?: number;
}
