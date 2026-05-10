export type TipoProducto = 'INSECTICIDA' | 'FUNGICIDA' | 'HERBICIDA' | 'BIOLOGICO';

export interface Producto {
    id?: number;
    nombreComercial: string;
    ingredienteActivo: string;
    tipo: TipoProducto;
    unidadBase: string;
}

export interface CreateProductoDto extends Omit<Producto, 'id'> {}
export interface UpdateProductoDto extends Partial<CreateProductoDto> {}
