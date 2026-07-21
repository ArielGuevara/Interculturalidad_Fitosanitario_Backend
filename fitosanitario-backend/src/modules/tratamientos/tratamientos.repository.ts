import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, desc, and, gte, ilike, or, sql, inArray } from 'drizzle-orm';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateTratamientoDto, moderadorId: number) {
    const cultivoId = dto.cultivoId ?? (dto.cultivoIds?.[0] ?? null);
    const result = await this.db
      .insert(schema.tratamientosOficiales)
      .values({
        reporteId: dto.reporteId ?? null,
        recomendacionOrigenId: dto.recomendacionOrigenId ?? null,
        moderadorId,
        cultivoId,
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
        nombre: dto.nombre ?? null,
        descripcion: dto.descripcion ?? null,
      })
      .returning();

    const tratamiento = result[0];
    if (tratamiento && dto.cultivoIds && dto.cultivoIds.length > 0) {
      await this.db.insert(schema.tratamientoCultivos).values(
        dto.cultivoIds.map((cid) => ({
          tratamientoId: tratamiento.id,
          cultivoId: cid,
        })),
      );
    }
    return tratamiento;
  }

  async findAll(search?: string, cultivoId?: number) {
    const conditions: any[] = [
      sql`${schema.tratamientosOficiales.reporteId} IS NULL`,
    ];
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(
        sql`unaccent(${schema.productosFitosanitarios.nombreComercial}) ILIKE unaccent(${pattern})`,
        sql`unaccent(${schema.cultivos.nombre}) ILIKE unaccent(${pattern})`,
        sql`unaccent(${schema.plagasEnfermedades.nombre}) ILIKE unaccent(${pattern})`,
      ));
    }
    if (cultivoId) {
      conditions.push(
        sql`${schema.tratamientosOficiales.id} IN (SELECT tc.tratamiento_id FROM tratamiento_cultivos tc WHERE tc.cultivo_id = ${cultivoId})`,
      );
    }
    const query = this.db
      .select({
        id: schema.tratamientosOficiales.id,
        reporteId: schema.tratamientosOficiales.reporteId,
        moderadorId: schema.tratamientosOficiales.moderadorId,
        cultivoId: schema.tratamientosOficiales.cultivoId,
        plagaId: schema.tratamientosOficiales.plagaId,
        productoId: schema.tratamientosOficiales.productoId,
        dosis: schema.tratamientosOficiales.dosis,
        unidadDosis: schema.tratamientosOficiales.unidadDosis,
        volumenAgua: schema.tratamientosOficiales.volumenAgua,
        unidadVolumen: schema.tratamientosOficiales.unidadVolumen,
        metodoAplicacion: schema.tratamientosOficiales.metodoAplicacion,
        intervaloDias: schema.tratamientosOficiales.intervaloDias,
        numeroAplicaciones: schema.tratamientosOficiales.numeroAplicaciones,
        duracionTotalDias: schema.tratamientosOficiales.duracionTotalDias,
        diasCarencia: schema.tratamientosOficiales.diasCarencia,
        periodoReingresoHoras: schema.tratamientosOficiales.periodoReingresoHoras,
        etapaCultivo: schema.tratamientosOficiales.etapaCultivo,
        condicionesAplicacion: schema.tratamientosOficiales.condicionesAplicacion,
        enEnciclopedia: schema.tratamientosOficiales.enEnciclopedia,
        fechaValidacion: schema.tratamientosOficiales.fechaValidacion,
        fechaUltimaActualizacion: schema.tratamientosOficiales.fechaUltimaActualizacion,
        nombre: schema.tratamientosOficiales.nombre,
        descripcion: schema.tratamientosOficiales.descripcion,
        cultivos: sql`(
          SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre) ORDER BY c.nombre)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
        )`,
        cultivo: sql<{ id: number; nombre: string; imagenUrl: string | null } | null>`(
          SELECT json_build_object('id', c.id, 'nombre', c.nombre, 'imagenUrl', c.imagen_url)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
          LIMIT 1
        )`,
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
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(schema.tratamientosOficiales.productoId, schema.productosFitosanitarios.id),
      )
      .innerJoin(
        schema.usuarios,
        eq(schema.tratamientosOficiales.moderadorId, schema.usuarios.id),
      );
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    return query.orderBy(desc(schema.tratamientosOficiales.fechaValidacion));
  }

  async findById(id: number) {
    const result = await this.db
      .select({
        id: schema.tratamientosOficiales.id,
        reporteId: schema.tratamientosOficiales.reporteId,
        moderadorId: schema.tratamientosOficiales.moderadorId,
        cultivoId: schema.tratamientosOficiales.cultivoId,
        plagaId: schema.tratamientosOficiales.plagaId,
        productoId: schema.tratamientosOficiales.productoId,
        dosis: schema.tratamientosOficiales.dosis,
        unidadDosis: schema.tratamientosOficiales.unidadDosis,
        volumenAgua: schema.tratamientosOficiales.volumenAgua,
        unidadVolumen: schema.tratamientosOficiales.unidadVolumen,
        metodoAplicacion: schema.tratamientosOficiales.metodoAplicacion,
        intervaloDias: schema.tratamientosOficiales.intervaloDias,
        numeroAplicaciones: schema.tratamientosOficiales.numeroAplicaciones,
        duracionTotalDias: schema.tratamientosOficiales.duracionTotalDias,
        diasCarencia: schema.tratamientosOficiales.diasCarencia,
        periodoReingresoHoras: schema.tratamientosOficiales.periodoReingresoHoras,
        etapaCultivo: schema.tratamientosOficiales.etapaCultivo,
        condicionesAplicacion: schema.tratamientosOficiales.condicionesAplicacion,
        enEnciclopedia: schema.tratamientosOficiales.enEnciclopedia,
        fechaValidacion: schema.tratamientosOficiales.fechaValidacion,
        fechaUltimaActualizacion: schema.tratamientosOficiales.fechaUltimaActualizacion,
        nombre: schema.tratamientosOficiales.nombre,
        descripcion: schema.tratamientosOficiales.descripcion,
        cultivos: sql`(
          SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre) ORDER BY c.nombre)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
        )`,
        cultivo: sql<{ id: number; nombre: string; imagenUrl: string | null } | null>`(
          SELECT json_build_object('id', c.id, 'nombre', c.nombre, 'imagenUrl', c.imagen_url)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
          LIMIT 1
        )`,
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
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(schema.tratamientosOficiales.productoId, schema.productosFitosanitarios.id),
      )
      .innerJoin(
        schema.usuarios,
        eq(schema.tratamientosOficiales.moderadorId, schema.usuarios.id),
      )
      .where(eq(schema.tratamientosOficiales.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByReporte(reporteId: number) {
    const result = await this.db
      .select({
        id: schema.tratamientosOficiales.id,
        reporteId: schema.tratamientosOficiales.reporteId,
        moderadorId: schema.tratamientosOficiales.moderadorId,
        cultivoId: schema.tratamientosOficiales.cultivoId,
        plagaId: schema.tratamientosOficiales.plagaId,
        productoId: schema.tratamientosOficiales.productoId,
        dosis: schema.tratamientosOficiales.dosis,
        unidadDosis: schema.tratamientosOficiales.unidadDosis,
        volumenAgua: schema.tratamientosOficiales.volumenAgua,
        unidadVolumen: schema.tratamientosOficiales.unidadVolumen,
        metodoAplicacion: schema.tratamientosOficiales.metodoAplicacion,
        intervaloDias: schema.tratamientosOficiales.intervaloDias,
        numeroAplicaciones: schema.tratamientosOficiales.numeroAplicaciones,
        duracionTotalDias: schema.tratamientosOficiales.duracionTotalDias,
        diasCarencia: schema.tratamientosOficiales.diasCarencia,
        periodoReingresoHoras: schema.tratamientosOficiales.periodoReingresoHoras,
        etapaCultivo: schema.tratamientosOficiales.etapaCultivo,
        condicionesAplicacion: schema.tratamientosOficiales.condicionesAplicacion,
        enEnciclopedia: schema.tratamientosOficiales.enEnciclopedia,
        fechaValidacion: schema.tratamientosOficiales.fechaValidacion,
        fechaUltimaActualizacion: schema.tratamientosOficiales.fechaUltimaActualizacion,
        nombre: schema.tratamientosOficiales.nombre,
        descripcion: schema.tratamientosOficiales.descripcion,
        cultivos: sql`(
          SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre) ORDER BY c.nombre)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
        )`,
        cultivo: sql<{ id: number; nombre: string; imagenUrl: string | null } | null>`(
          SELECT json_build_object('id', c.id, 'nombre', c.nombre, 'imagenUrl', c.imagen_url)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
          LIMIT 1
        )`,
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
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(schema.tratamientosOficiales.productoId, schema.productosFitosanitarios.id),
      )
      .innerJoin(
        schema.usuarios,
        eq(schema.tratamientosOficiales.moderadorId, schema.usuarios.id),
      )
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
        cultivos: sql`(
          SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre, 'imagenUrl', c.imagen_url) ORDER BY c.nombre)
          FROM tratamiento_cultivos tc
          JOIN cultivos c ON c.id = tc.cultivo_id
          WHERE tc.tratamiento_id = ${schema.tratamientosOficiales.id}
        )`,
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
        schema.plagasEnfermedades,
        eq(schema.tratamientosOficiales.plagaId, schema.plagasEnfermedades.id),
      )
      .innerJoin(
        schema.productosFitosanitarios,
        eq(schema.tratamientosOficiales.productoId, schema.productosFitosanitarios.id),
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
    const updateData: any = { ...dto, fechaUltimaActualizacion: new Date() };
    if (dto.cultivoIds) {
      delete updateData.cultivoIds;
    }
    const result = await this.db
      .update(schema.tratamientosOficiales)
      .set(updateData)
      .where(eq(schema.tratamientosOficiales.id, id))
      .returning();

    if (dto.cultivoIds && result[0]) {
      await this.db
        .delete(schema.tratamientoCultivos)
        .where(eq(schema.tratamientoCultivos.tratamientoId, id));
      await this.db.insert(schema.tratamientoCultivos).values(
        dto.cultivoIds.map((cid) => ({
          tratamientoId: id,
          cultivoId: cid,
        })),
      );
    }

    return result[0] ?? null;
  }

  async delete(id: number) {
    await this.db
      .delete(schema.tratamientoCultivos)
      .where(eq(schema.tratamientoCultivos.tratamientoId, id));
    const result = await this.db
      .delete(schema.tratamientosOficiales)
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
