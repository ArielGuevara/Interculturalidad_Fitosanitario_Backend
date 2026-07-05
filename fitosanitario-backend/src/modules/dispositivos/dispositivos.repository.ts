import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';

@Injectable()
export class DispositivosRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.dispositivos)
      .where(eq(schema.dispositivos.activo, true));
  }

  async findByUser(usuarioId: number) {
    return this.db
      .select()
      .from(schema.dispositivos)
      .where(
        and(
          eq(schema.dispositivos.usuarioId, usuarioId),
          eq(schema.dispositivos.activo, true),
        ),
      );
  }

  async findByToken(token: string) {
    const rows = await this.db
      .select()
      .from(schema.dispositivos)
      .where(eq(schema.dispositivos.token, token));
    return rows[0] || null;
  }

  async register(
    usuarioId: number,
    data: { token: string; plataforma: string },
  ) {
    const existing = await this.findByToken(data.token);
    if (existing) {
      const rows = await this.db
        .update(schema.dispositivos)
        .set({ usuarioId, activo: true, ultimoUso: new Date() })
        .where(eq(schema.dispositivos.id, existing.id))
        .returning();
      return rows[0];
    }
    const rows = await this.db
      .insert(schema.dispositivos)
      .values({ usuarioId, ...data })
      .returning();
    return rows[0];
  }

  async unregister(token: string) {
    await this.db
      .update(schema.dispositivos)
      .set({ activo: false })
      .where(eq(schema.dispositivos.token, token));
  }
}
