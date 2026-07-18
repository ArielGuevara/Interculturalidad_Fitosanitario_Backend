import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { DB_CONNECTION } from '../../db/db.module';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { CreatePlagaDto } from './dto/create-plaga.dto';
import { UpdatePlagaDto } from './dto/update-plaga.dto';

@Injectable()
export class PlagasRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(search?: string, cultivoId?: number) {
    const conditions: any[] = [];
    if (search) {
      conditions.push(sql`unaccent(${schema.plagasEnfermedades.nombre}) ILIKE unaccent(${'%' + search + '%'})`);
    }
    if (cultivoId) {
      conditions.push(sql`${schema.plagasEnfermedades.id} IN (SELECT plaga_id FROM plagas_cultivos WHERE cultivo_id = ${cultivoId})`);
    }
    const query = this.db.select().from(schema.plagasEnfermedades);
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findCultivosByPlaga(plagaId: number) {
    return this.db
      .select({
        id: schema.cultivos.id,
        nombre: schema.cultivos.nombre,
      })
      .from(schema.plagasCultivos)
      .innerJoin(schema.cultivos, eq(schema.plagasCultivos.cultivoId, schema.cultivos.id))
      .where(eq(schema.plagasCultivos.plagaId, plagaId));
  }

  async findAllAsociaciones(): Promise<{ plagaId: number; id: number; nombre: string }[]> {
    return this.db
      .select({
        plagaId: schema.plagasCultivos.plagaId,
        id: schema.cultivos.id,
        nombre: schema.cultivos.nombre,
      })
      .from(schema.plagasCultivos)
      .innerJoin(schema.cultivos, eq(schema.plagasCultivos.cultivoId, schema.cultivos.id));
  }

  async setCultivos(plagaId: number, cultivoIds: number[]) {
    await this.db.delete(schema.plagasCultivos).where(eq(schema.plagasCultivos.plagaId, plagaId));
    if (cultivoIds.length > 0) {
      await this.db.insert(schema.plagasCultivos).values(
        cultivoIds.map(cultivoId => ({ plagaId, cultivoId }))
      );
    }
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
