import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';

@Injectable()
export class ResetTokensRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: {
    usuarioId: number;
    codigo: string;
    telefono: string;
    expiresAt: Date;
  }) {
    const result = await this.db
      .insert(schema.resetTokens)
      .values(data)
      .returning();
    return result[0];
  }

  async findValid(telefono: string, codigo: string) {
    const result = await this.db
      .select()
      .from(schema.resetTokens)
      .where(
        and(
          eq(schema.resetTokens.telefono, telefono),
          eq(schema.resetTokens.codigo, codigo),
          eq(schema.resetTokens.usado, false),
          gt(schema.resetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async markAsUsed(id: number) {
    await this.db
      .update(schema.resetTokens)
      .set({ usado: true })
      .where(eq(schema.resetTokens.id, id));
  }
}
