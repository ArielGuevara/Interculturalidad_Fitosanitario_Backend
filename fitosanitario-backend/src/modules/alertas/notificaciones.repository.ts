import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, desc, or, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';

@Injectable()
export class NotificacionesRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByUser(usuarioId: number) {
    return this.db
      .select()
      .from(schema.notificaciones)
      .where(
        or(
          eq(schema.notificaciones.usuarioId, usuarioId),
          eq(schema.notificaciones.esGlobal, true),
        ),
      )
      .orderBy(desc(schema.notificaciones.createdAt));
  }

  async create(data: any) {
    const rows = await this.db
      .insert(schema.notificaciones)
      .values(data)
      .returning();
    return rows[0];
  }

  async marcarLeida(id: number) {
    const rows = await this.db
      .update(schema.notificaciones)
      .set({ leida: true })
      .where(eq(schema.notificaciones.id, id))
      .returning();
    return rows[0];
  }

  async findGlobales() {
    // Deduplicar por (titulo, cuerpo, tipo) para mantener compatibilidad
    // con registros antiguos que creaban uno por usuario
    const rows = await this.db
      .select({
        id: sql<number>`MAX(${schema.notificaciones.id})`.as('id'),
        titulo: schema.notificaciones.titulo,
        cuerpo: schema.notificaciones.cuerpo,
        tipo: schema.notificaciones.tipo,
        createdAt: sql<string>`MAX(${schema.notificaciones.createdAt})`.as('createdAt'),
      })
      .from(schema.notificaciones)
      .where(eq(schema.notificaciones.esGlobal, true))
      .groupBy(
        schema.notificaciones.titulo,
        schema.notificaciones.cuerpo,
        schema.notificaciones.tipo,
      )
      .orderBy(desc(sql`MAX(${schema.notificaciones.createdAt})`))
      .limit(100);
    return rows;
  }

  async countNoLeidas(usuarioId: number) {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notificaciones)
      .where(
        and(
          or(
            eq(schema.notificaciones.usuarioId, usuarioId),
            eq(schema.notificaciones.esGlobal, true),
          ),
          eq(schema.notificaciones.leida, false),
        ),
      );
    return rows[0]?.count || 0;
  }

  async update(id: number, data: { titulo?: string; cuerpo?: string }) {
    const rows = await this.db
      .update(schema.notificaciones)
      .set(data)
      .where(eq(schema.notificaciones.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: number) {
    await this.db
      .delete(schema.notificaciones)
      .where(eq(schema.notificaciones.id, id));
  }
}
