import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, desc, sql } from 'drizzle-orm';
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
      .where(eq(schema.notificaciones.usuarioId, usuarioId))
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

  async countNoLeidas(usuarioId: number) {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notificaciones)
      .where(
        and(
          eq(schema.notificaciones.usuarioId, usuarioId),
          eq(schema.notificaciones.leida, false),
        ),
      );
    return rows[0]?.count || 0;
  }
}
