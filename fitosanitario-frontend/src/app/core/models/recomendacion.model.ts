export type TipoRecomendacion = 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL';

export interface RecomendacionComunidad {
    id: number;
    reporteId?: number | null;
    titulo: string;
    descripcion: string;
    tipo: TipoRecomendacion;
    valoracionPromedio: number;
    totalValoraciones: number;
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
}

export interface ComentarioForo {
    id: number;
    comentarioPadreId?: number | null;
    contenido: string;
    fechaComentario: string;
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
