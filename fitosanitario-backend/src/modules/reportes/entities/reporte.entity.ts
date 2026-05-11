export type ReporteEntity = {
  id: number;
  titulo: string;
  descripcion: string | null;
  usuarioId: number;
  cultivoId: number;
  imagenesUrls: string[];
  audioUrl: string | null;
  latitud: number;
  longitud: number;
  createdAt: Date;
};
