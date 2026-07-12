export interface Notificacion {
  id: number;
  usuarioId: number;
  alertaId?: number | null;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  createdAt: string;
}
