import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';

@Injectable()
export class ZonasRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.zonasAlerta)
      .where(eq(schema.zonasAlerta.activo, true));
  }

  async findById(id: number) {
    const rows = await this.db
      .select()
      .from(schema.zonasAlerta)
      .where(eq(schema.zonasAlerta.id, id));
    return rows[0] || null;
  }

  async create(data: any) {
    const rows = await this.db
      .insert(schema.zonasAlerta)
      .values(data)
      .returning();
    return rows[0];
  }

  async update(id: number, data: any) {
    const rows = await this.db
      .update(schema.zonasAlerta)
      .set(data)
      .where(eq(schema.zonasAlerta.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number) {
    await this.db
      .delete(schema.zonasAlerta)
      .where(eq(schema.zonasAlerta.id, id));
  }
}
