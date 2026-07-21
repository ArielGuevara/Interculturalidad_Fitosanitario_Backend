export interface Notificacion {
  id: number;
  usuarioId: number;
  alertaId?: number | null;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  esGlobal?: boolean;
  tipo?: string | null;
  data?: string | null;
  createdAt: string;
}
