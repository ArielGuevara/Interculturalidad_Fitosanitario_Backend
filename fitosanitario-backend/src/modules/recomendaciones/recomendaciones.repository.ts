import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';

@Injectable()
export class RecomendacionesRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateRecomendacionDto, usuarioId: number) {
    const result = await this.db
      .insert(schema.recomendacionesComunidad)
      .values({
        reporteId: dto.reporteId ?? null,
        usuarioId,
        cultivoId: dto.cultivoId ?? null,
        plagaId: dto.plagaId ?? null,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        tipo: dto.tipo,
      })
      .returning();
    return result[0];
  }

  async findAll(filtros?: {
    tipo?: string;
    cultivoId?: number;
    plagaId?: number;
  }) {
    const conditions = [eq(schema.recomendacionesComunidad.activo, true)];

    if (filtros?.tipo) {
      conditions.push(
        eq(schema.recomendacionesComunidad.tipo, filtros.tipo as any),
      );
    }
    if (filtros?.cultivoId) {
      conditions.push(
        eq(schema.recomendacionesComunidad.cultivoId, filtros.cultivoId),
      );
    }
    if (filtros?.plagaId) {
      conditions.push(
        eq(schema.recomendacionesComunidad.plagaId, filtros.plagaId),
      );
    }

    return this.db
      .select({
        id: schema.recomendacionesComunidad.id,
        titulo: schema.recomendacionesComunidad.titulo,
        descripcion: schema.recomendacionesComunidad.descripcion,
        tipo: schema.recomendacionesComunidad.tipo,
        valoracionPromedio: schema.recomendacionesComunidad.valoracionPromedio,
        totalValoraciones: schema.recomendacionesComunidad.totalValoraciones,
        moderado: schema.recomendacionesComunidad.moderado,
        createdAt: schema.recomendacionesComunidad.createdAt,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
        cultivo: {
          id: schema.cultivos.id,
          nombre: schema.cultivos.nombre,
        },
        plaga: {
          id: schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
        },
      })
      .from(schema.recomendacionesComunidad)
      .leftJoin(
        schema.usuarios,
        eq(schema.recomendacionesComunidad.usuarioId, schema.usuarios.id),
      )
      .leftJoin(
        schema.cultivos,
        eq(schema.recomendacionesComunidad.cultivoId, schema.cultivos.id),
      )
      .leftJoin(
        schema.plagasEnfermedades,
        eq(
          schema.recomendacionesComunidad.plagaId,
          schema.plagasEnfermedades.id,
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(schema.recomendacionesComunidad.createdAt));
  }

  async findById(id: number) {
    const result = await this.db
      .select({
        id: schema.recomendacionesComunidad.id,
        reporteId: schema.recomendacionesComunidad.reporteId,
        titulo: schema.recomendacionesComunidad.titulo,
        descripcion: schema.recomendacionesComunidad.descripcion,
        tipo: schema.recomendacionesComunidad.tipo,
        valoracionPromedio: schema.recomendacionesComunidad.valoracionPromedio,
        totalValoraciones: schema.recomendacionesComunidad.totalValoraciones,
        moderado: schema.recomendacionesComunidad.moderado,
        activo: schema.recomendacionesComunidad.activo,
        createdAt: schema.recomendacionesComunidad.createdAt,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
        cultivo: {
          id: schema.cultivos.id,
          nombre: schema.cultivos.nombre,
        },
        plaga: {
          id: schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
        },
      })
      .from(schema.recomendacionesComunidad)
      .leftJoin(
        schema.usuarios,
        eq(schema.recomendacionesComunidad.usuarioId, schema.usuarios.id),
      )
      .leftJoin(
        schema.cultivos,
        eq(schema.recomendacionesComunidad.cultivoId, schema.cultivos.id),
      )
      .leftJoin(
        schema.plagasEnfermedades,
        eq(
          schema.recomendacionesComunidad.plagaId,
          schema.plagasEnfermedades.id,
        ),
      )
      .where(eq(schema.recomendacionesComunidad.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUsuario(usuarioId: number) {
    return this.db
      .select({
        id: schema.recomendacionesComunidad.id,
        titulo: schema.recomendacionesComunidad.titulo,
        descripcion: schema.recomendacionesComunidad.descripcion,
        tipo: schema.recomendacionesComunidad.tipo,
        valoracionPromedio: schema.recomendacionesComunidad.valoracionPromedio,
        totalValoraciones: schema.recomendacionesComunidad.totalValoraciones,
        moderado: schema.recomendacionesComunidad.moderado,
        createdAt: schema.recomendacionesComunidad.createdAt,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
        cultivo: {
          id: schema.cultivos.id,
          nombre: schema.cultivos.nombre,
        },
        plaga: {
          id: schema.plagasEnfermedades.id,
          nombre: schema.plagasEnfermedades.nombre,
        },
      })
      .from(schema.recomendacionesComunidad)
      .leftJoin(
        schema.usuarios,
        eq(schema.recomendacionesComunidad.usuarioId, schema.usuarios.id),
      )
      .leftJoin(
        schema.cultivos,
        eq(schema.recomendacionesComunidad.cultivoId, schema.cultivos.id),
      )
      .leftJoin(
        schema.plagasEnfermedades,
        eq(
          schema.recomendacionesComunidad.plagaId,
          schema.plagasEnfermedades.id,
        ),
      )
      .where(
        and(
          eq(schema.recomendacionesComunidad.usuarioId, usuarioId),
          eq(schema.recomendacionesComunidad.activo, true),
        ),
      )
      .orderBy(desc(schema.recomendacionesComunidad.createdAt));
  }

  async update(
    id: number,
    data: {
      titulo?: string;
      descripcion?: string;
      tipo?: 'RECOMENDACION' | 'CONSULTA' | 'CONOCIMIENTO_ANCESTRAL';
    },
  ) {
    const result = await this.db
      .update(schema.recomendacionesComunidad)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();
    return result[0] ?? null;
  }

  async softDelete(id: number) {
    const result = await this.db
      .update(schema.recomendacionesComunidad)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();
    return result[0] ?? null;
  }

  async moderar(id: number, moderado: boolean) {
    const result = await this.db
      .update(schema.recomendacionesComunidad)
      .set({ moderado, updatedAt: new Date() })
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();
    return result[0] ?? null;
  }

  // ── Valoraciones ──

  async crearValoracion(
    recomendacionId: number,
    usuarioId: number,
    puntuacion: number,
    comentario?: string,
  ) {
    const result = await this.db
      .insert(schema.valoraciones)
      .values({
        recomendacionId,
        usuarioId,
        puntuacion,
        comentario: comentario ?? null,
      })
      .returning();
    return result[0];
  }

  async findValoracionByUsuario(recomendacionId: number, usuarioId: number) {
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

  async getValoraciones(recomendacionId: number) {
    return this.db
      .select({
        id: schema.valoraciones.id,
        puntuacion: schema.valoraciones.puntuacion,
        comentario: schema.valoraciones.comentario,
        createdAt: schema.valoraciones.createdAt,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.valoraciones)
      .leftJoin(
        schema.usuarios,
        eq(schema.valoraciones.usuarioId, schema.usuarios.id),
      )
      .where(eq(schema.valoraciones.recomendacionId, recomendacionId))
      .orderBy(desc(schema.valoraciones.createdAt));
  }

  async getComentarios(recomendacionId: number) {
    const todos = await this.db
      .select({
        id: schema.comentariosForo.id,
        comentarioPadreId: schema.comentariosForo.comentarioPadreId,
        contenido: schema.comentariosForo.contenido,
        fechaComentario: schema.comentariosForo.fechaComentario,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.comentariosForo)
      .leftJoin(
        schema.usuarios,
        eq(schema.comentariosForo.usuarioId, schema.usuarios.id),
      )
      .where(
        and(
          eq(schema.comentariosForo.recomendacionId, recomendacionId),
          eq(schema.comentariosForo.activo, true),
        ),
      )
      .orderBy(schema.comentariosForo.fechaComentario);

    const raices = todos.filter((comentario) => !comentario.comentarioPadreId);
    const respuestas = todos.filter(
      (comentario) => comentario.comentarioPadreId,
    );

    return raices.map((comentario) => ({
      ...comentario,
      respuestas: respuestas.filter(
        (respuesta) => respuesta.comentarioPadreId === comentario.id,
      ),
    }));
  }

  async actualizarPromedio(recomendacionId: number) {
    const stats = await this.db
      .select({
        promedio: sql<number>`COALESCE(AVG(puntuacion), 0)::float`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(schema.valoraciones)
      .where(eq(schema.valoraciones.recomendacionId, recomendacionId));

    const { promedio, total } = stats[0];

    await this.db
      .update(schema.recomendacionesComunidad)
      .set({
        valoracionPromedio: Math.round(promedio * 100) / 100,
        totalValoraciones: total,
        updatedAt: new Date(),
      })
      .where(eq(schema.recomendacionesComunidad.id, recomendacionId));

    return {
      valoracionPromedio: Math.round(promedio * 100) / 100,
      totalValoraciones: total,
    };
  }
}
