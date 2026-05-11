export type Reporte = {
  id: number;
  titulo: string;
  descripcion: string | null;
  usuarioId: number;
  cultivoId: number;
  imagenesUrls: string[];
  audioUrl: string | null;
  latitud: number;
  longitud: number;
  createdAt: string;
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

export type PendingReporte = {
  id: string;
  payload: CreateReporteInput;
  createdAt: number;
};
