export interface Cultivo {
    id?: number;
    nombre: string;
    descripcion: string;
    imagenUrl?: string;
}

export interface CreateCultivoDto extends Omit<Cultivo, 'id'> {}
export interface UpdateCultivoDto extends Partial<CreateCultivoDto> {}
