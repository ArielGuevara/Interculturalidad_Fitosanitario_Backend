import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, desc, and, sql, or, ilike, lte, isNotNull, isNull, inArray } from 'drizzle-orm';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';

@Injectable()
export class RecomendacionesRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private selectBase = {
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
    motivoRechazo: schema.recomendacionesComunidad.motivoRechazo,
    fechaExpiracion: schema.recomendacionesComunidad.fechaExpiracion,
    solucion: schema.recomendacionesComunidad.solucion,
    comentarioModerador: schema.recomendacionesComunidad.comentarioModerador,
    imagenUrl: schema.recomendacionesComunidad.imagenUrl,
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
  };

  private baseJoins(query: any) {
    return query
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
        eq(schema.recomendacionesComunidad.plagaId, schema.plagasEnfermedades.id),
      );
  }

  async create(dto: CreateRecomendacionDto, usuarioId: number) {
    const values: any = {
      reporteId: dto.reporteId ?? null,
      usuarioId,
      cultivoId: dto.cultivoId ?? null,
      plagaId: dto.plagaId ?? null,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo: dto.tipo,
    };
    if (dto.solucion !== undefined) values.solucion = dto.solucion;
    if (dto.comentarioModerador !== undefined) values.comentarioModerador = dto.comentarioModerador;
    if (dto.imagenUrl !== undefined) values.imagenUrl = dto.imagenUrl;
    const result = await this.db
      .insert(schema.recomendacionesComunidad)
      .values(values as any)
      .returning();
    return result[0];
  }

  async findAll(filtros?: {
    tipo?: string;
    cultivoId?: number;
    plagaId?: number;
    moderado?: boolean;
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
    if (filtros?.moderado !== undefined) {
      conditions.push(
        eq(schema.recomendacionesComunidad.moderado, filtros.moderado),
      );
    }

    return this.baseJoins(
      this.db
        .select(this.selectBase)
        .from(schema.recomendacionesComunidad)
    )
      .where(and(...conditions))
      .orderBy(desc(schema.recomendacionesComunidad.createdAt));
  }

  private saberesSelect = {
    ...this.selectBase,
    valoracionesBuenas:
      sql<number>`COALESCE((SELECT COUNT(*) FROM ${schema.valoraciones} WHERE ${schema.valoraciones.recomendacionId} = ${schema.recomendacionesComunidad.id} AND ${schema.valoraciones.puntuacion} >= 4), 0)`,
    valoracionesMalas:
      sql<number>`COALESCE((SELECT COUNT(*) FROM ${schema.valoraciones} WHERE ${schema.valoraciones.recomendacionId} = ${schema.recomendacionesComunidad.id} AND ${schema.valoraciones.puntuacion} <= 2), 0)`,
  };

  async findAllSaberes(filtros?: {
    q?: string;
    estado?: string;
    cultivoId?: number;
    plagaId?: number;
  }, usuarioId?: number) {
    const conditions: any[] = [
      eq(schema.recomendacionesComunidad.tipo, 'CONOCIMIENTO_ANCESTRAL' as any),
    ];

    if (filtros?.q) {
      const pattern = `%${filtros.q}%`;
      conditions.push(
        or(
          ilike(schema.recomendacionesComunidad.titulo, pattern),
          ilike(schema.recomendacionesComunidad.descripcion, pattern),
          ilike(schema.recomendacionesComunidad.solucion, pattern),
        ),
      );
    }
    if (filtros?.estado && filtros.estado !== 'todos') {
      switch (filtros.estado) {
        case 'pendientes':
          conditions.push(
            and(
              eq(schema.recomendacionesComunidad.moderado, false),
              eq(schema.recomendacionesComunidad.activo, true),
              isNull(schema.recomendacionesComunidad.motivoRechazo),
            ),
          );
          break;
        case 'publicados':
          conditions.push(
            and(
              eq(schema.recomendacionesComunidad.moderado, true),
              eq(schema.recomendacionesComunidad.activo, true),
              or(
                isNull(schema.recomendacionesComunidad.fechaExpiracion),
                sql`${schema.recomendacionesComunidad.fechaExpiracion} > NOW()`,
              ),
            ),
          );
          break;
        case 'expirados':
          conditions.push(
            and(
              eq(schema.recomendacionesComunidad.moderado, true),
              sql`${schema.recomendacionesComunidad.fechaExpiracion} IS NOT NULL`,
              sql`${schema.recomendacionesComunidad.fechaExpiracion} <= NOW()`,
            ),
          );
          break;
        case 'rechazados':
          conditions.push(
            and(
              isNotNull(schema.recomendacionesComunidad.motivoRechazo),
              eq(schema.recomendacionesComunidad.activo, false),
            ),
          );
          break;
      }
    }
    if (filtros?.cultivoId) {
      conditions.push(eq(schema.recomendacionesComunidad.cultivoId, filtros.cultivoId));
    }
    if (filtros?.plagaId) {
      conditions.push(eq(schema.recomendacionesComunidad.plagaId, filtros.plagaId));
    }

    const saberes = await this.baseJoins(
      this.db
        .select(this.saberesSelect)
        .from(schema.recomendacionesComunidad)
    )
      .where(and(...conditions))
      .orderBy(desc(schema.recomendacionesComunidad.createdAt));

    if (usuarioId && saberes.length > 0) {
      const ids = saberes.map(s => s.id);
      const valoraciones = await this.db
        .select({
          recomendacionId: schema.valoraciones.recomendacionId,
          puntuacion: schema.valoraciones.puntuacion,
        })
        .from(schema.valoraciones)
        .where(
          and(
            inArray(schema.valoraciones.recomendacionId, ids),
            eq(schema.valoraciones.usuarioId, usuarioId),
          ),
        );
      const valMap = new Map(valoraciones.map(v => [v.recomendacionId, v.puntuacion]));
      for (const s of saberes) {
        (s as any).miValoracion = valMap.get(s.id) ?? null;
      }
    }

    return saberes;
  }

  async findById(id: number) {
    const result = await this.baseJoins(
      this.db
        .select({ ...this.selectBase, activo: schema.recomendacionesComunidad.activo })
        .from(schema.recomendacionesComunidad)
    )
      .where(eq(schema.recomendacionesComunidad.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUsuario(usuarioId: number) {
    return this.baseJoins(
      this.db
        .select(this.selectBase)
        .from(schema.recomendacionesComunidad)
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
      solucion?: string;
      comentarioModerador?: string;
      fechaExpiracion?: Date | null;
      activo?: boolean;
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

  async hardDelete(id: number) {
    const result = await this.db
      .delete(schema.recomendacionesComunidad)
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();
    return result[0] ?? null;
  }

  async moderate(
    id: number,
    data: {
      moderado: boolean;
      moderadorId?: number;
      motivoRechazo?: string;
      fechaExpiracion?: Date | null;
    },
  ) {
    const updateData: any = {
      moderado: data.moderado,
      updatedAt: new Date(),
    };
    if (data.moderadorId !== undefined) updateData.moderadorId = data.moderadorId;
    if (data.motivoRechazo !== undefined) updateData.motivoRechazo = data.motivoRechazo;
    if (data.fechaExpiracion !== undefined) updateData.fechaExpiracion = data.fechaExpiracion;

    const result = await this.db
      .update(schema.recomendacionesComunidad)
      .set(updateData)
      .where(eq(schema.recomendacionesComunidad.id, id))
      .returning();
    return result[0] ?? null;
  }

  async promoteComment(data: {
    comentarioOrigenId: number;
    usuarioId: number;
    plagaId: number;
    titulo: string;
    solucion: string;
    comentarioModerador?: string;
    cultivoId?: number | null;
  }) {
    const result = await this.db
      .insert(schema.recomendacionesComunidad)
      .values({
        usuarioId: data.usuarioId,
        plagaId: data.plagaId,
        cultivoId: data.cultivoId ?? null,
        titulo: data.titulo,
        descripcion: data.solucion,
        tipo: 'CONOCIMIENTO_ANCESTRAL',
        moderado: true,
        activo: true,
        comentarioOrigenId: data.comentarioOrigenId,
        solucion: data.solucion,
        comentarioModerador: data.comentarioModerador ?? null,
      } as any)
      .returning();
    return result[0];
  }

  async getInteracciones(recomendacionId: number) {
    const comentarios = await this.db
      .select({
        id: schema.comentariosForo.id,
        comentarioPadreId: schema.comentariosForo.comentarioPadreId,
        contenido: schema.comentariosForo.contenido,
        fechaComentario: schema.comentariosForo.fechaComentario,
        activo: schema.comentariosForo.activo,
        audioUrl: schema.comentariosForo.audioUrl,
        imagenUrl: schema.comentariosForo.imagenUrl,
        esModerador: schema.usuarios.rol,
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
      .where(eq(schema.comentariosForo.recomendacionId, recomendacionId))
      .orderBy(schema.comentariosForo.fechaComentario);

    const raices = comentarios.filter((c) => !c.comentarioPadreId);
    const respuestas = comentarios.filter((c) => c.comentarioPadreId);

    const comentariosTree = raices.map((c) => ({
      ...c,
      esModerador: c.esModerador === 'MODERADOR' || c.esModerador === 'ADMIN',
      respuestas: respuestas.filter((r) => r.comentarioPadreId === c.id).map(r => ({
        ...r,
        esModerador: r.esModerador === 'MODERADOR' || r.esModerador === 'ADMIN',
      })),
    }));

    const valoraciones = await this.db
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

    return { comentarios: comentariosTree, valoraciones };
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

  async findValoracionesByUsuario(recomendacionIds: number[], usuarioId: number) {
    if (recomendacionIds.length === 0) return [];
    return this.db
      .select({
        recomendacionId: schema.valoraciones.recomendacionId,
        puntuacion: schema.valoraciones.puntuacion,
      })
      .from(schema.valoraciones)
      .where(
        and(
          inArray(schema.valoraciones.recomendacionId, recomendacionIds),
          eq(schema.valoraciones.usuarioId, usuarioId),
        ),
      );
  }

  async upsertValoracion(
    recomendacionId: number,
    usuarioId: number,
    puntuacion: number,
  ) {
    const existente = await this.findValoracionByUsuario(
      recomendacionId,
      usuarioId,
    );
    if (existente) {
      if (existente.puntuacion === puntuacion) {
        // Misma valoración → eliminar (toggle off)
        await this.db
          .delete(schema.valoraciones)
          .where(eq(schema.valoraciones.id, existente.id));
        return { accion: 'eliminada' } as const;
      }
      const result = await this.db
        .update(schema.valoraciones)
        .set({ puntuacion })
        .where(eq(schema.valoraciones.id, existente.id))
        .returning();
      return { accion: 'actualizada', valoracion: result[0] } as const;
    }
    const result = await this.db
      .insert(schema.valoraciones)
      .values({ recomendacionId, usuarioId, puntuacion })
      .returning();
    return { accion: 'creada', valoracion: result[0] } as const;
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

  async getValoracionCounts(recomendacionId: number) {
    const result = await this.db
      .select({
        buenas: sql<number>`COALESCE(SUM(CASE WHEN ${schema.valoraciones.puntuacion} >= 4 THEN 1 ELSE 0 END), 0)`,
        malas: sql<number>`COALESCE(SUM(CASE WHEN ${schema.valoraciones.puntuacion} <= 2 THEN 1 ELSE 0 END), 0)`,
      })
      .from(schema.valoraciones)
      .where(eq(schema.valoraciones.recomendacionId, recomendacionId));
    return {
      valoracionesBuenas: Number(result[0]?.buenas ?? 0),
      valoracionesMalas: Number(result[0]?.malas ?? 0),
    };
  }

  async getComentarios(recomendacionId: number) {
    const todos = await this.db
      .select({
        id: schema.comentariosForo.id,
        comentarioPadreId: schema.comentariosForo.comentarioPadreId,
        contenido: schema.comentariosForo.contenido,
        fechaComentario: schema.comentariosForo.fechaComentario,
        esModerador: schema.usuarios.rol,
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
      esModerador: comentario.esModerador === 'MODERADOR' || comentario.esModerador === 'ADMIN',
      respuestas: respuestas.filter(
        (respuesta) => respuesta.comentarioPadreId === comentario.id,
      ).map(r => ({ ...r, esModerador: r.esModerador === 'MODERADOR' || r.esModerador === 'ADMIN' })),
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
