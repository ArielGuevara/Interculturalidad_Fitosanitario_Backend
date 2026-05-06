import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { DB_CONNECTION } from '../../db/db.module';
import { eq } from 'drizzle-orm';
import { CreatePlagaDto } from './dto/create-plaga.dto';
import { UpdatePlagaDto } from './dto/update-plaga.dto';

@Injectable()
export class PlagasRepository {

    constructor(
        @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
      ) {}
    

  findAll() {
    return this.db.select().from(schema.plagasEnfermedades);
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.plagasEnfermedades)
      .where(eq(schema.plagasEnfermedades.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(dto: CreatePlagaDto) {
    const result = await this.db
      .insert(schema.plagasEnfermedades)
      .values(dto)
      .returning();

    return result[0];
  }

  async update(id: number, dto: UpdatePlagaDto) {
    const result = await this.db
      .update(schema.plagasEnfermedades)
      .set(dto)
      .where(eq(schema.plagasEnfermedades.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: number) {
    const result = await this.db
      .delete(schema.plagasEnfermedades)
      .where(eq(schema.plagasEnfermedades.id, id))
      .returning();

    return result[0] ?? null;
  }
}