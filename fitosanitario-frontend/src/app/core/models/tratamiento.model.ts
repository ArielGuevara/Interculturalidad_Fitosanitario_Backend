export type MetodoAplicacion = 'FOLIAR' | 'SUELO' | 'RIEGO';

export interface CreateTratamientoDto {
    reporteId?: number;
    recomendacionOrigenId?: number;
    cultivoId: number;
    plagaId: number;
    productoId: number;
    dosis: number;
    unidadDosis: string;
    volumenAgua?: number;
    unidadVolumen?: string;
    metodoAplicacion: MetodoAplicacion;
    intervaloDias: number;
    numeroAplicaciones: number;
    duracionTotalDias: number;
    diasCarencia: number;
    periodoReingresoHoras?: number;
    etapaCultivo?: string;
    condicionesAplicacion?: string;
    enEnciclopedia?: boolean;
}

export interface TratamientoOficial extends CreateTratamientoDto {
    id: number;
    moderadorId?: number;
    fechaValidacion: string;
    fechaUltimaActualizacion?: string;
    cultivo?: {
        id: number;
        nombre: string;
    };
    plaga?: {
        id: number;
        nombre: string;
        tipo?: string;
    };
    producto?: {
        id: number;
        nombreComercial: string;
        tipo?: string;
    };
    moderador?: {
        id: number;
        nombre: string;
    };
}
