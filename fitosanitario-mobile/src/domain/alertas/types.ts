export interface Alerta {
  id: number;
  zonaId?: number;
  parametroId?: number;
  plagaId?: number;
  cultivoId?: number;
  titulo: string;
  descripcion: string;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  latitud?: number;
  longitud?: number;
  totalReportes: number;
  leida: boolean;
  createdAt: string;
}

export interface Notificacion {
  id: number;
  usuarioId: number;
  alertaId?: number;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  esGlobal?: boolean;
  tipo?: string;
  data?: {
    type?: string;
    reporteId?: number;
    tratamientoId?: number;
    recomendacionId?: number;
  };
  createdAt: string;
}

export interface ZonaAlerta {
  id: number;
  nombre: string;
  descripcion?: string;
  latitudCentro: number;
  longitudCentro: number;
  radioKm: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParametroAlerta {
  id: number;
  nombre: string;
  plagaId?: number;
  cultivoId?: number;
  umbralReportes: number;
  radioKm: number;
  ventanaHoras: number;
  activo: boolean;
  createdAt: string;
}
