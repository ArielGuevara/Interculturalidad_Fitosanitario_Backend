export type Tratamiento = {
  id: number;
  reporteId: number | null;
  moderadorId: number;
  cultivoId: number | null;
  plagaId: number;
  productoId: number;
  dosis: number;
  unidadDosis: string;
  volumenAgua: number | null;
  unidadVolumen: string | null;
  metodoAplicacion: 'FOLIAR' | 'SUELO' | 'RIEGO';
  intervaloDias: number;
  numeroAplicaciones: number;
  duracionTotalDias: number;
  diasCarencia: number;
  periodoReingresoHoras: number | null;
  etapaCultivo: string | null;
  condicionesAplicacion: string | null;
  enEnciclopedia: boolean;
  fechaValidacion: string;
  fechaUltimaActualizacion: string | null;
  nombre: string | null;
  descripcion: string | null;
};

export type TratamientoConRelaciones = Tratamiento & {
  cultivos: { id: number; nombre: string }[];
  cultivo: { id: number; nombre: string; imagenUrl: string | null } | null;
  plaga: { id: number; nombre: string; tipo: string };
  producto: { id: number; nombreComercial: string; tipo: string };
  moderador: { id: number; nombre: string };
};
