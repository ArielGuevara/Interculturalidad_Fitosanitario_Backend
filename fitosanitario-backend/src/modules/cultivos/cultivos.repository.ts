import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { DB_CONNECTION } from '../../db/db.module';
import { eq } from 'drizzle-orm';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Injectable()
export class CultivosRepository {

    constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.cultivos);
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.cultivos)
      .where(eq(schema.cultivos.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(dto: CreateCultivoDto) {
    const result = await this.db
      .insert(schema.cultivos)
      .values(dto)
      .returning();

    return result[0];
  }

  async update(id: number, dto: UpdateCultivoDto) {
    const result = await this.db
      .update(schema.cultivos)
      .set(dto)
      .where(eq(schema.cultivos.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: number) {
    const result = await this.db
      .delete(schema.cultivos)
      .where(eq(schema.cultivos.id, id))
      .returning();

    return result[0] ?? null;
  }
}