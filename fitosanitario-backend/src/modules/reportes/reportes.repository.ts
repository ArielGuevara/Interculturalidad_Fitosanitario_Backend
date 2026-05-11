import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class ReportesRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(params: {
    titulo: string;
    descripcion?: string;
    usuarioId: number;
    cultivoId: number;
    imagenesUrls: string[];
    audioUrl?: string | null;
    latitud: number;
    longitud: number;
  }) {
    const result = await this.db
      .insert(schema.reportes)
      .values({
        titulo: params.titulo,
        descripcion: params.descripcion ?? null,
        usuarioId: params.usuarioId,
        cultivoId: params.cultivoId,
        imagenesUrls: params.imagenesUrls,
        audioUrl: params.audioUrl ?? null,
        latitud: params.latitud,
        longitud: params.longitud,
      })
      .returning();

    return result[0];
  }

  async findAll() {
    return this.db
      .select()
      .from(schema.reportes)
      .orderBy(desc(schema.reportes.createdAt));
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.reportes)
      .where(eq(schema.reportes.id, id))
      .limit(1);

    return result[0] ?? null;
  }
}
