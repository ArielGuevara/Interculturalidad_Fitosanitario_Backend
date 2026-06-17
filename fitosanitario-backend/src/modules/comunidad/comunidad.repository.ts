import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase }     from 'drizzle-orm/node-postgres';
import { DB_CONNECTION }      from '../../db/db.module';
import * as schema            from '../../db/schema';
import { eq, desc, avg, count, and, isNull } from 'drizzle-orm';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateValoracionDto }    from './dto/create-valoracion.dto';
import { CreateComentarioDto }    from './dto/create-comentario.dto';

@Injectable()
export class ComunidadRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Recomendaciones ────────────────────────────────────────

  async createRecomendacion(dto: CreateRecomendacionDto, usuarioId: number) {
    const result = await this.db
      .insert(schema.recomendacionesComunidad)
      .values({
        reporteId:           dto.reporteId,
        usuarioId,
        productoId:          dto.productoId ?? null,
        productoNombreLibre: dto.productoNombreLibre ?? null,
        dosis:               dto.dosis,
        unidadDosis:         dto.unidadDosis,
        intervaloDias:       dto.intervaloDias,
        numeroAplicaciones:  dto.numeroAplicaciones,
        duracionTotalDias:   dto.duracionTotalDias,
        metodoAplicacion:    dto.metodoAplicacion ?? null,
        observaciones:       dto.observaciones ?? null,
      })
      .returning();

    return result[0];
  }

  async findRecomendacionesByReporte(reporteId: number) {
    // Trae recomendaciones activas con promedio de puntuación y conteo
    const recomendaciones = await this.db
      .select({
        id:                  schema.recomendacionesComunidad.id,
        productoId:          schema.recomendacionesComunidad.productoId,
        productoNombreLibre: schema.recomendacionesComunidad.productoNombreLibre,
        dosis:               schema.recomendacionesComunidad.dosis,
        unidadDosis:         schema.recomendacionesComunidad.unidadDosis,
        intervaloDias:       schema.recomendacionesComunidad.intervaloDias,
        numeroAplicaciones:  schema.recomendacionesComunidad.numeroAplicaciones,
        duracionTotalDias:   schema.recomendacionesComunidad.duracionTotalDias,
        metodoAplicacion:    schema.recomendacionesComunidad.metodoAplicacion,
        observaciones:       schema.recomendacionesComunidad.observaciones,
        fechaAporte:         schema.recomendacionesComunidad.fechaAporte,
        usuario: {
          id:     schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.recomendacionesComunidad)
      .innerJoin(schema.usuarios, eq(schema.recomendacionesComunidad.usuarioId, schema.usuarios.id))
      .where(
        and(
          eq(schema.recomendacionesComunidad.reporteId, reporteId),
          eq(schema.recomendacionesComunidad.activo, true),
        ),
      )
      .orderBy(desc(schema.recomendacionesComunidad.fechaAporte));

    return recomendaciones;
  }

  async findRecomendacionById(id: number) {
    const result = await this.db
      .select()
      .from(schema.recomendacionesComunidad)
      .where(eq(schema.recomendacionesComunidad.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  // Eliminación lógica — RF-09
  async desactivarRecomendacion(id: number, moderadorId: number) {
    const result = await this.db
      .update(schema.recomendacionesComunidad)
      .set({
        activo:          false,
        moderadoPor:     moderadorId,
        fechaModeracion: new Date(),
      })
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();

    return result[0];
  }

  // ── Valoraciones ───────────────────────────────────────────

  async findValoracionExistente(recomendacionId: number, usuarioId: number) {
    const result = await this.db
      .select()
      .from(schema.valoracionesRecomendacion)
      .where(
        and(
          eq(schema.valoracionesRecomendacion.recomendacionId, recomendacionId),
          eq(schema.valoracionesRecomendacion.usuarioId, usuarioId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async upsertValoracion(
    recomendacionId: number,
    usuarioId: number,
    puntuacion: number,
  ) {
    const existente = await this.findValoracionExistente(recomendacionId, usuarioId);

    if (existente) {
      // Actualiza la valoración existente
      const result = await this.db
        .update(schema.valoracionesRecomendacion)
        .set({ puntuacion, fechaValoracion: new Date() })
        .where(eq(schema.valoracionesRecomendacion.id, existente.id))
        .returning();
      return result[0];
    }

    // Crea nueva valoración
    const result = await this.db
      .insert(schema.valoracionesRecomendacion)
      .values({ recomendacionId, usuarioId, puntuacion })
      .returning();
    return result[0];
  }

  async getPromedioValoracion(recomendacionId: number) {
    const result = await this.db
      .select({
        promedio: avg(schema.valoracionesRecomendacion.puntuacion),
        total:    count(schema.valoracionesRecomendacion.id),
      })
      .from(schema.valoracionesRecomendacion)
      .where(eq(schema.valoracionesRecomendacion.recomendacionId, recomendacionId));

    return {
      promedio: Number(result[0]?.promedio ?? 0),
      total:    Number(result[0]?.total ?? 0),
    };
  }

  // ── Comentarios ────────────────────────────────────────────

  async createComentario(
    recomendacionId: number,
    usuarioId: number,
    dto: CreateComentarioDto,
  ) {
    const result = await this.db
      .insert(schema.comentariosForo)
      .values({
        recomendacionId,
        usuarioId,
        comentarioPadreId: dto.comentarioPadreId ?? null,
        contenido:         dto.contenido,
      })
      .returning();

    return result[0];
  }

  // Trae comentarios raíz con sus respuestas anidadas (un nivel)
  async findComentariosByRecomendacion(recomendacionId: number) {
    const todos = await this.db
      .select({
        id:                schema.comentariosForo.id,
        comentarioPadreId: schema.comentariosForo.comentarioPadreId,
        contenido:         schema.comentariosForo.contenido,
        fechaComentario:   schema.comentariosForo.fechaComentario,
        usuario: {
          id:     schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.comentariosForo)
      .innerJoin(schema.usuarios, eq(schema.comentariosForo.usuarioId, schema.usuarios.id))
      .where(
        and(
          eq(schema.comentariosForo.recomendacionId, recomendacionId),
          eq(schema.comentariosForo.activo, true),
        ),
      )
      .orderBy(schema.comentariosForo.fechaComentario);

    // Armar árbol: raíces con sus respuestas anidadas
    const raices   = todos.filter(c => !c.comentarioPadreId);
    const respuestas = todos.filter(c =>  c.comentarioPadreId);

    return raices.map(raiz => ({
      ...raiz,
      respuestas: respuestas.filter(r => r.comentarioPadreId === raiz.id),
    }));
  }

  async findComentarioById(id: number) {
    const result = await this.db
      .select()
      .from(schema.comentariosForo)
      .where(eq(schema.comentariosForo.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async desactivarComentario(id: number, moderadorId: number) {
    const result = await this.db
      .update(schema.comentariosForo)
      .set({
        activo:          false,
        moderadoPor:     moderadorId,
        fechaModeracion: new Date(),
      })
      .where(eq(schema.comentariosForo.id, id))
      .returning();

    return result[0];
  }
}