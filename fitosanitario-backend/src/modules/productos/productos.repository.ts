import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { DB_CONNECTION } from '../../db/db.module';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(search?: string, cultivoId?: number) {
    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(schema.productosFitosanitarios.nombreComercial, `%${search}%`),
        ilike(schema.productosFitosanitarios.ingredienteActivo, `%${search}%`),
      ));
    }
    if (cultivoId) {
      conditions.push(sql`${schema.productosFitosanitarios.id} IN (SELECT producto_id FROM productos_cultivos WHERE cultivo_id = ${cultivoId})`);
    }
    const query = this.db.select().from(schema.productosFitosanitarios);
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findCultivosByProducto(productoId: number) {
    return this.db
      .select({
        id: schema.cultivos.id,
        nombre: schema.cultivos.nombre,
      })
      .from(schema.productosCultivos)
      .innerJoin(schema.cultivos, eq(schema.productosCultivos.cultivoId, schema.cultivos.id))
      .where(eq(schema.productosCultivos.productoId, productoId));
  }

  async setCultivos(productoId: number, cultivoIds: number[]) {
    await this.db.delete(schema.productosCultivos).where(eq(schema.productosCultivos.productoId, productoId));
    if (cultivoIds.length > 0) {
      await this.db.insert(schema.productosCultivos).values(
        cultivoIds.map(cultivoId => ({ productoId, cultivoId }))
      );
    }
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.productosFitosanitarios)
      .where(eq(schema.productosFitosanitarios.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(dto: CreateProductoDto) {
    const result = await this.db
      .insert(schema.productosFitosanitarios)
      .values(dto)
      .returning();

    return result[0];
  }

  async update(id: number, dto: UpdateProductoDto) {
    const result = await this.db
      .update(schema.productosFitosanitarios)
      .set(dto)
      .where(eq(schema.productosFitosanitarios.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: number) {
    const result = await this.db
      .delete(schema.productosFitosanitarios)
      .where(eq(schema.productosFitosanitarios.id, id))
      .returning();

    return result[0] ?? null;
  }
}
