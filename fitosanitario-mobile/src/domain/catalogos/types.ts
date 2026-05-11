export type Cultivo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
};

export type Plaga = {
  id: number;
  nombre: string;
  tipo: 'PLAGA' | 'ENFERMEDAD' | 'MALEZA';
  descripcion: string | null;
  imagenUrl: string | null;
};

export type Producto = {
  id: number;
  nombreComercial: string;
  ingredienteActivo: string | null;
  tipo: 'INSECTICIDA' | 'FUNGICIDA' | 'HERBICIDA' | 'BIOLOGICO';
  unidadBase: string | null;
};
