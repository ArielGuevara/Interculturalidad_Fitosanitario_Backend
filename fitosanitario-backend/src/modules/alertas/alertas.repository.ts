import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, desc, lte, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';

@Injectable()
export class AlertasRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Zonas ──
  async findAllZonas() {
    return this.db.select().from(schema.zonasAlerta).where(eq(schema.zonasAlerta.activo, true));
  }

  async findZonaById(id: number) {
    const rows = await this.db.select().from(schema.zonasAlerta).where(eq(schema.zonasAlerta.id, id));
    return rows[0] || null;
  }

  async createZona(data: any) {
    const rows = await this.db.insert(schema.zonasAlerta).values(data).returning();
    return rows[0];
  }

  async updateZona(id: number, data: any) {
    const rows = await this.db.update(schema.zonasAlerta).set(data).where(eq(schema.zonasAlerta.id, id)).returning();
    return rows[0];
  }

  async deleteZona(id: number) {
    await this.db.delete(schema.zonasAlerta).where(eq(schema.zonasAlerta.id, id));
  }

  // ── Parámetros ──
  async findAllParametros() {
    return this.db.select().from(schema.parametrosAlerta).where(eq(schema.parametrosAlerta.activo, true));
  }

  async findParametroById(id: number) {
    const rows = await this.db.select().from(schema.parametrosAlerta).where(eq(schema.parametrosAlerta.id, id));
    return rows[0] || null;
  }

  async createParametro(data: any) {
    const rows = await this.db.insert(schema.parametrosAlerta).values(data).returning();
    return rows[0];
  }

  async updateParametro(id: number, data: any) {
    const rows = await this.db.update(schema.parametrosAlerta).set(data).where(eq(schema.parametrosAlerta.id, id)).returning();
    return rows[0];
  }

  async deleteParametro(id: number) {
    await this.db.delete(schema.parametrosAlerta).where(eq(schema.parametrosAlerta.id, id));
  }

  // ── Alertas ──
  async findAll(usuarioId?: number) {
    if (usuarioId) {
      return this.db
        .select()
        .from(schema.alertas)
        .orderBy(desc(schema.alertas.createdAt));
    }
    return this.db.select().from(schema.alertas).orderBy(desc(schema.alertas.createdAt));
  }

  async findById(id: number) {
    const rows = await this.db.select().from(schema.alertas).where(eq(schema.alertas.id, id));
    return rows[0] || null;
  }

  async create(data: any) {
    const rows = await this.db.insert(schema.alertas).values(data).returning();
    return rows[0];
  }

  async marcarLeida(id: number) {
    const rows = await this.db.update(schema.alertas).set({ leida: true }).where(eq(schema.alertas.id, id)).returning();
    return rows[0];
  }

  // ── Detección de brotes ──
  async detectarBrotes(horas: number) {
    const desde = new Date(Date.now() - horas * 3600 * 1000);
    const parametros = await this.findAllParametros();

    const brotes: Array<{ parametro: any; reportes: any[] }> = [];

    for (const p of parametros) {
      let condiciones = and(
        gte(schema.reportes.createdAt, desde),
        eq(schema.reportes.estado, 'PENDIENTE'),
      );
      if (p.plagaId) {
        condiciones = and(condiciones, eq(schema.reportes.plagaId, p.plagaId)) as any;
      }
      if (p.cultivoId) {
        condiciones = and(condiciones, eq(schema.reportes.cultivoId, p.cultivoId)) as any;
      }

      const reportes = await this.db
        .select()
        .from(schema.reportes)
        .where(condiciones as any);

      if (reportes.length >= p.umbralReportes) {
        brotes.push({ parametro: p, reportes });
      }
    }

    return brotes;
  }

  // ── Notificaciones ──
  async findNotificacionesByUser(usuarioId: number) {
    return this.db
      .select()
      .from(schema.notificaciones)
      .where(eq(schema.notificaciones.usuarioId, usuarioId))
      .orderBy(desc(schema.notificaciones.createdAt));
  }

  async createNotificacion(data: any) {
    const rows = await this.db.insert(schema.notificaciones).values(data).returning();
    return rows[0];
  }

  async marcarNotificacionLeida(id: number) {
    const rows = await this.db.update(schema.notificaciones).set({ leida: true }).where(eq(schema.notificaciones.id, id)).returning();
    return rows[0];
  }

  async countNotificacionesNoLeidas(usuarioId: number) {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notificaciones)
      .where(and(eq(schema.notificaciones.usuarioId, usuarioId), eq(schema.notificaciones.leida, false)));
    return rows[0]?.count || 0;
  }
}
