export type TipoRecomendacion = 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL';

export type Recomendacion = {
  id: number;
  reporteId: number | null;
  titulo: string;
  descripcion: string;
  tipo: TipoRecomendacion;
  valoracionPromedio: number;
  totalValoraciones: number;
  moderado: boolean;
  createdAt: string;
  usuario: {
    id: number;
    nombre: string;
  };
  cultivo: {
    id: number;
    nombre: string;
  } | null;
  plaga: {
    id: number;
    nombre: string;
  } | null;
};

export type CreateRecomendacionInput = {
  reporteId?: number;
  cultivoId?: number;
  plagaId?: number;
  titulo: string;
  descripcion: string;
  tipo: TipoRecomendacion;
};

export type Valoracion = {
  id: number;
  puntuacion: number;
  comentario: string | null;
  createdAt: string;
  usuario: {
    id: number;
    nombre: string;
  };
};

export type ComentarioForo = {
  id: number;
  contenido: string;
  audioUrl?: string | null;
  usuario: {
    id: number;
    nombre: string;
  };
  comentarioPadreId: number | null;
  respuestas?: ComentarioForo[];
  activo: boolean;
  fechaComentario: string;
};
