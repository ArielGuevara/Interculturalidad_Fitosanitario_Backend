export interface ZonaAlerta {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  latitudCentro: number;
  longitudCentro: number;
  radioKm: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZonaAlertaDto {
  nombre: string;
  descripcion?: string;
  latitudCentro: number;
  longitudCentro: number;
  radioKm: number;
}

export interface ParametroAlerta {
  id?: number;
  nombre: string;
  plagaId?: number | null;
  cultivoId?: number | null;
  umbralReportes: number;
  radioKm: number;
  ventanaHoras: number;
  activo: boolean;
  createdAt: string;
}

export interface CreateParametroAlertaDto {
  nombre: string;
  plagaId?: number;
  cultivoId?: number;
  umbralReportes?: number;
  radioKm?: number;
  ventanaHoras?: number;
}

export interface Alerta {
  id: number;
  zonaId?: number | null;
  parametroId?: number | null;
  plagaId?: number | null;
  cultivoId?: number | null;
  titulo: string;
  descripcion: string;
  nivel: string;
  latitud?: number | null;
  longitud?: number | null;
  totalReportes: number;
  leida: boolean;
  createdAt: string;
}
