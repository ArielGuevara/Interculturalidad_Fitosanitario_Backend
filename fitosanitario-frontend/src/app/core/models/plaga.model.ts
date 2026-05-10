export type TipoPlaga = 'PLAGA' | 'ENFERMEDAD' | 'MALEZA';

export interface Plaga {
    id?: number;
    nombre: string;
    tipo: TipoPlaga;
    descripcion: string;
    imagenUrl?: string;
}

export interface CreatePlagaDto extends Omit<Plaga, 'id'> {}
export interface UpdatePlagaDto extends Partial<CreatePlagaDto> {}
