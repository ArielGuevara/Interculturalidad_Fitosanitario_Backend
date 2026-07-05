import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, desc } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';

@Injectable()
export class AlertasRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.alertas)
      .orderBy(desc(schema.alertas.createdAt));
  }

  async findById(id: number) {
    const rows = await this.db
      .select()
      .from(schema.alertas)
      .where(eq(schema.alertas.id, id));
    return rows[0] || null;
  }

  async create(data: any) {
    const rows = await this.db.insert(schema.alertas).values(data).returning();
    return rows[0];
  }

  async marcarLeida(id: number) {
    const rows = await this.db
      .update(schema.alertas)
      .set({ leida: true })
      .where(eq(schema.alertas.id, id))
      .returning();
    return rows[0];
  }

  async detectarBrotes(horas: number) {
    const desde = new Date(Date.now() - horas * 3600 * 1000);
    const parametros = await this.db
      .select()
      .from(schema.parametrosAlerta)
      .where(eq(schema.parametrosAlerta.activo, true));

    const brotes: { parametro: any; reportes: any[] }[] = [];

    for (const p of parametros) {
      let condiciones = and(
        gte(schema.reportes.createdAt, desde),
        eq(schema.reportes.estado, 'PENDIENTE'),
      );
      if (p.plagaId) {
        condiciones = and(condiciones, eq(schema.reportes.plagaId, p.plagaId));
      }
      if (p.cultivoId) {
        condiciones = and(
          condiciones,
          eq(schema.reportes.cultivoId, p.cultivoId),
        );
      }

      const reportes = await this.db
        .select()
        .from(schema.reportes)
        .where(condiciones);

      if (reportes.length >= p.umbralReportes) {
        brotes.push({ parametro: p, reportes });
      }
    }

    return brotes;
  }
}
