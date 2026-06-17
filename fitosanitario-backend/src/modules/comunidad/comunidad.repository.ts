import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase }     from 'drizzle-orm/node-postgres';
import { DB_CONNECTION }      from '../../db/db.module';
import * as schema            from '../../db/schema';
import { eq, desc, avg, count, and } from 'drizzle-orm';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateComentarioDto }    from './dto/create-comentario.dto';

@Injectable()
export class ComunidadRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Recomendaciones ────────────────────────────────────────

  async createRecomendacion(dto: CreateRecomendacionDto, usuarioId: number) {
    const titulo = dto.titulo?.trim() || this.buildTitulo(dto);
    const descripcion = dto.descripcion?.trim() || this.buildDescripcion(dto);

    const result = await this.db
      .insert(schema.recomendacionesComunidad)
      .values({
        reporteId:           dto.reporteId ?? null,
        usuarioId,
        cultivoId:           dto.cultivoId ?? null,
        plagaId:             dto.plagaId ?? null,
        titulo,
        descripcion,
        tipo:                dto.tipo ?? 'RECOMENDACION',
      })
      .returning();

    return result[0];
  }

  async findRecomendacionesByReporte(reporteId: number) {
    // Trae recomendaciones activas con promedio de puntuación y conteo
    const recomendaciones = await this.db
      .select({
        id:                  schema.recomendacionesComunidad.id,
        reporteId:           schema.recomendacionesComunidad.reporteId,
        titulo:              schema.recomendacionesComunidad.titulo,
        descripcion:         schema.recomendacionesComunidad.descripcion,
        tipo:                schema.recomendacionesComunidad.tipo,
        valoracionPromedio:  schema.recomendacionesComunidad.valoracionPromedio,
        totalValoraciones:   schema.recomendacionesComunidad.totalValoraciones,
        moderado:            schema.recomendacionesComunidad.moderado,
        createdAt:           schema.recomendacionesComunidad.createdAt,
        usuario: {
          id:     schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
        cultivo: {
          id:     schema.cultivos.id,
          nombre: schema.cultivos.nombre,
        },
        plaga: {
          id:     schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
        },
      })
      .from(schema.recomendacionesComunidad)
      .innerJoin(schema.usuarios, eq(schema.recomendacionesComunidad.usuarioId, schema.usuarios.id))
      .leftJoin(schema.cultivos, eq(schema.recomendacionesComunidad.cultivoId, schema.cultivos.id))
      .leftJoin(schema.plagasEnfermedades, eq(schema.recomendacionesComunidad.plagaId, schema.plagasEnfermedades.id))
      .where(
        and(
          eq(schema.recomendacionesComunidad.reporteId, reporteId),
          eq(schema.recomendacionesComunidad.activo, true),
        ),
      )
      .orderBy(desc(schema.recomendacionesComunidad.createdAt));

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
        moderado:        true,
        updatedAt:       new Date(),
      })
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();

    return result[0];
  }

  // ── Valoraciones ───────────────────────────────────────────

  async findValoracionExistente(recomendacionId: number, usuarioId: number) {
    const result = await this.db
      .select()
      .from(schema.valoraciones)
      .where(
        and(
          eq(schema.valoraciones.recomendacionId, recomendacionId),
          eq(schema.valoraciones.usuarioId, usuarioId),
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
        .update(schema.valoraciones)
        .set({ puntuacion })
        .where(eq(schema.valoraciones.id, existente.id))
        .returning();
      return result[0];
    }

    // Crea nueva valoración
    const result = await this.db
      .insert(schema.valoraciones)
      .values({ recomendacionId, usuarioId, puntuacion })
      .returning();
    return result[0];
  }

  async getPromedioValoracion(recomendacionId: number) {
    const result = await this.db
      .select({
        promedio: avg(schema.valoraciones.puntuacion),
        total:    count(schema.valoraciones.id),
      })
      .from(schema.valoraciones)
      .where(eq(schema.valoraciones.recomendacionId, recomendacionId));

    return {
      promedio: Number(result[0]?.promedio ?? 0),
      total:    Number(result[0]?.total ?? 0),
    };
  }

  async actualizarPromedioValoracion(recomendacionId: number) {
    const promedio = await this.getPromedioValoracion(recomendacionId);

    await this.db
      .update(schema.recomendacionesComunidad)
      .set({
        valoracionPromedio: promedio.promedio,
        totalValoraciones:  promedio.total,
        updatedAt:          new Date(),
      })
      .where(eq(schema.recomendacionesComunidad.id, recomendacionId));

    return promedio;
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

  private buildTitulo(dto: CreateRecomendacionDto) {
    const producto = dto.productoNombreLibre || (dto.productoId ? `Producto #${dto.productoId}` : 'Recomendación comunitaria');
    return `${producto}`.slice(0, 200);
  }

  private buildDescripcion(dto: CreateRecomendacionDto) {
    const partes = [
      dto.observaciones,
      dto.dosis !== undefined && dto.unidadDosis ? `Dosis: ${dto.dosis} ${dto.unidadDosis}` : undefined,
      dto.intervaloDias ? `Intervalo: cada ${dto.intervaloDias} día(s)` : undefined,
      dto.numeroAplicaciones ? `Aplicaciones: ${dto.numeroAplicaciones}` : undefined,
      dto.duracionTotalDias ? `Duración total: ${dto.duracionTotalDias} día(s)` : undefined,
      dto.metodoAplicacion ? `Método: ${dto.metodoAplicacion}` : undefined,
    ].filter(Boolean);

    return partes.join('. ') || 'Recomendación comunitaria sin descripción adicional';
  }
}
