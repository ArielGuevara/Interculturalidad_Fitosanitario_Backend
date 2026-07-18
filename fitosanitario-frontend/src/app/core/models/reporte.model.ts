export type EstadoReporte = 'PENDIENTE' | 'COMUNIDAD' | 'VALIDADO' | 'RECHAZADO' | 'VOLVER_A_REPORTAR';

export interface Reporte {
    id: number;
    titulo: string;
    descripcion?: string | null;
    descripcionProblema?: string | null;
    usuarioId: number;
    cultivoId: number;
    plagaId?: number | null;
    imagenesUrls: string[];
    audioUrl?: string | null;
    latitud: number;
    longitud: number;
    estado: EstadoReporte;
    sincronizado: boolean;
    motivoRechazo?: string | null;
    audioRechazoUrl?: string | null;
    createdAt: string;
}

export interface ReporteHistorialEstado {
    id: number;
    estadoAnterior?: EstadoReporte | null;
    estadoNuevo: EstadoReporte;
    motivo?: string | null;
    fechaCambio: string;
    usuario?: {
        id: number;
        nombre: string;
    };
}

export interface CambiarEstadoReporteDto {
    estado: EstadoReporte;
    motivo?: string;
}
