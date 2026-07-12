import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, desc, and, gte, ilike, or } from 'drizzle-orm';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateTratamientoDto, moderadorId: number) {
    const result = await this.db
      .insert(schema.tratamientosOficiales)
      .values({
        reporteId: dto.reporteId ?? null,
        recomendacionOrigenId: dto.recomendacionOrigenId ?? null,
        moderadorId,
        cultivoId: dto.cultivoId,
        plagaId: dto.plagaId,
        productoId: dto.productoId,
        dosis: dto.dosis,
        unidadDosis: dto.unidadDosis,
        volumenAgua: dto.volumenAgua ?? null,
        unidadVolumen: dto.unidadVolumen ?? null,
        metodoAplicacion: dto.metodoAplicacion,
        intervaloDias: dto.intervaloDias,
        numeroAplicaciones: dto.numeroAplicaciones,
        duracionTotalDias: dto.duracionTotalDias,
        diasCarencia: dto.diasCarencia,
        periodoReingresoHoras: dto.periodoReingresoHoras ?? null,
        etapaCultivo: dto.etapaCultivo ?? null,
        condicionesAplicacion: dto.condicionesAplicacion ?? null,
        enEnciclopedia: dto.enEnciclopedia ?? false,
      })
      .returning();

    return result[0];
  }

  async findAll(search?: string) {
    const query = this.db
      .select({
        id: schema.tratamientosOficiales.id,
        dosis: schema.tratamientosOficiales.dosis,
        unidadDosis: schema.tratamientosOficiales.unidadDosis,
        metodoAplicacion: schema.tratamientosOficiales.metodoAplicacion,
        intervaloDias: schema.tratamientosOficiales.intervaloDias,
        numeroAplicaciones: schema.tratamientosOficiales.numeroAplicaciones,
        duracionTotalDias: schema.tratamientosOficiales.duracionTotalDias,
        diasCarencia: schema.tratamientosOficiales.diasCarencia,
        enEnciclopedia: schema.tratamientosOficiales.enEnciclopedia,
        fechaValidacion: schema.tratamientosOficiales.fechaValidacion,
        cultivo: {
          id: schema.cultivos.id,
          nombre: schema.cultivos.nombre,
        },
        plaga: {
          id: schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
          tipo: schema.plagasEnfermedades.tipo,
        },
        producto: {
          id: schema.productosFitosanitarios.id,
          nombreComercial: schema.productosFitosanitarios.nombreComercial,
          tipo: schema.productosFitosanitarios.tipo,
        },
        moderador: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.tratamientosOficiales)
      .innerJoin(
        schema.cultivos,
        eq(schema.tratamientosOficiales.cultivoId, schema.cultivos.id),
      )
      .innerJoin(
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(
          schema.tratamientosOficiales.productoId,
          schema.productosFitosanitarios.id,
        ),
      )
      .innerJoin(
        schema.usuarios,
        eq(schema.tratamientosOficiales.moderadorId, schema.usuarios.id),
      );
    if (search) {
      const pattern = `%${search}%`;
      query.where(or(
        ilike(schema.productosFitosanitarios.nombreComercial, pattern),
        ilike(schema.cultivos.nombre, pattern),
        ilike(schema.plagasEnfermedades.nombre, pattern),
      ));
    }
    return query.orderBy(desc(schema.tratamientosOficiales.fechaValidacion));
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.tratamientosOficiales)
      .where(eq(schema.tratamientosOficiales.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByReporte(reporteId: number) {
    const result = await this.db
      .select()
      .from(schema.tratamientosOficiales)
      .where(eq(schema.tratamientosOficiales.reporteId, reporteId))
      .limit(1);

    return result[0] ?? null;
  }

  // Enciclopedia — solo los marcados para descarga offline (RF-04)
  async findEnciclopedia() {
    return this.db
      .select({
        id: schema.tratamientosOficiales.id,
        dosis: schema.tratamientosOficiales.dosis,
        unidadDosis: schema.tratamientosOficiales.unidadDosis,
        volumenAgua: schema.tratamientosOficiales.volumenAgua,
        unidadVolumen: schema.tratamientosOficiales.unidadVolumen,
        metodoAplicacion: schema.tratamientosOficiales.metodoAplicacion,
        intervaloDias: schema.tratamientosOficiales.intervaloDias,
        numeroAplicaciones: schema.tratamientosOficiales.numeroAplicaciones,
        duracionTotalDias: schema.tratamientosOficiales.duracionTotalDias,
        diasCarencia: schema.tratamientosOficiales.diasCarencia,
        periodoReingresoHoras:
          schema.tratamientosOficiales.periodoReingresoHoras,
        etapaCultivo: schema.tratamientosOficiales.etapaCultivo,
        condicionesAplicacion:
          schema.tratamientosOficiales.condicionesAplicacion,
        fechaUltimaActualizacion:
          schema.tratamientosOficiales.fechaUltimaActualizacion,
        cultivo: {
          id: schema.cultivos.id,
          nombre: schema.cultivos.nombre,
          imagenUrl: schema.cultivos.imagenUrl,
        },
        plaga: {
          id: schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
          tipo: schema.plagasEnfermedades.tipo,
          imagenUrl: schema.plagasEnfermedades.imagenUrl,
        },
        producto: {
          id: schema.productosFitosanitarios.id,
          nombreComercial: schema.productosFitosanitarios.nombreComercial,
          ingredienteActivo: schema.productosFitosanitarios.ingredienteActivo,
          unidadBase: schema.productosFitosanitarios.unidadBase,
        },
      })
      .from(schema.tratamientosOficiales)
      .innerJoin(
        schema.cultivos,
        eq(schema.tratamientosOficiales.cultivoId, schema.cultivos.id),
      )
      .innerJoin(
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(
          schema.tratamientosOficiales.productoId,
          schema.productosFitosanitarios.id,
        ),
      )
      .where(eq(schema.tratamientosOficiales.enEnciclopedia, true))
      .orderBy(schema.cultivos.nombre, schema.plagasEnfermedades.nombre);
  }

  // Enciclopedia con filtro de fecha — para sync incremental (RF-04)
  async findEnciclopediaDesde(fechaDesde: Date) {
    return this.db
      .select()
      .from(schema.tratamientosOficiales)
      .where(
        and(
          eq(schema.tratamientosOficiales.enEnciclopedia, true),
          gte(
            schema.tratamientosOficiales.fechaUltimaActualizacion,
            fechaDesde,
          ),
        ),
      )
      .orderBy(desc(schema.tratamientosOficiales.fechaUltimaActualizacion));
  }

  async update(id: number, dto: UpdateTratamientoDto) {
    const result = await this.db
      .update(schema.tratamientosOficiales)
      .set({
        ...dto,
        fechaUltimaActualizacion: new Date(),
      })
      .where(eq(schema.tratamientosOficiales.id, id))
      .returning();

    return result[0] ?? null;
  }

  async marcarEnciclopedia(id: number, enEnciclopedia: boolean) {
    const result = await this.db
      .update(schema.tratamientosOficiales)
      .set({
        enEnciclopedia,
        fechaUltimaActualizacion: new Date(),
      })
      .where(eq(schema.tratamientosOficiales.id, id))
      .returning();

    return result[0] ?? null;
  }
}
