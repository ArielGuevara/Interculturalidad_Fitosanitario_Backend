import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { DB_CONNECTION } from '../../db/db.module';
import { eq } from 'drizzle-orm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosRepository {

    constructor(
            @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
          ) {}

  findAll() {
    return this.db.select().from(schema.productosFitosanitarios);
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