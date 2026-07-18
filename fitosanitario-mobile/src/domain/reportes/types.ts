export type Reporte = {
  id: number;
  titulo: string;
  descripcion: string | null;
  descripcionProblema: string | null;
  usuarioId: number;
  cultivoId: number;
  plagaId: number | null;
  imagenesUrls: string[];
  audioUrl: string | null;
  latitud: number;
  longitud: number;
  estado: 'PENDIENTE' | 'COMUNIDAD' | 'VALIDADO' | 'RECHAZADO' | 'VOLVER_A_REPORTAR';
  sincronizado: boolean;
  motivoRechazo?: string | null;
  audioRechazoUrl?: string | null;
  createdAt: string;
  cultivo?: { id: number; nombre: string } | null;
  plaga?: { id: number; nombre: string; tipo: string } | null;
};

export type CreateReporteInput = {
  titulo: string;
  descripcion?: string;
  cultivoId: number;
  latitud: number;
  longitud: number;
  imageUris: string[];
  audioUri?: string;
};

export type HistorialEntry = {
  id: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  motivo: string | null;
  fechaCambio: string;
  usuario: { id: number; nombre: string };
};

export type PendingReporte = {
  id: string;
  payload: CreateReporteInput;
  createdAt: number;
};
