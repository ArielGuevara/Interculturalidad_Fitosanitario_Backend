import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, or, inArray, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';

@Injectable()
export class UsuariosRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findByRole(roles: string[]) {
    return this.db
      .select()
      .from(schema.usuarios)
      .where(inArray(schema.usuarios.rol, roles as any));
  }

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async findByTelefono(telefono: string) {
    const normalized = telefono.replace(/[^0-9]/g, '').replace(/^(593|0)/, '');
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(sql`REGEXP_REPLACE(${schema.usuarios.telefono}, '[^0-9]', '', 'g') LIKE ${'%' + normalized}`)
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

  async updatePassword(id: number, passwordHash: string) {
    await this.db
      .update(schema.usuarios)
      .set({ passwordHash })
      .where(eq(schema.usuarios.id, id));
  }

  async create(data: {
    nombre: string;
    email: string;
    telefono?: string | null;
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
