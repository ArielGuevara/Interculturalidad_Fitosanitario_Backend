import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';

@Injectable()
export class UsuariosRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}
  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol?: 'AGRICULTOR' | 'MODERADOR';
  }) {
    const result = await this.db
      .insert(schema.usuarios)
      .values(data)
      .returning();

    return result[0];
  }
}