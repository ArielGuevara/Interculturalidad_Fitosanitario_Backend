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

  // Haversine distance in km between two points
  private haversineKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calcularCentroide(reportes: any[]): { lat: number; lon: number } {
    let lat = 0, lon = 0, count = 0;
    for (const r of reportes) {
      if (r.latitud != null && r.longitud != null) {
        lat += r.latitud;
        lon += r.longitud;
        count++;
      }
    }
    if (count === 0) return { lat: 0, lon: 0 };
    return { lat: lat / count, lon: lon / count };
  }

  async detectarBrotes(horas: number) {
    const desde = new Date(Date.now() - horas * 3600 * 1000);
    const parametros = await this.db
      .select()
      .from(schema.parametrosAlerta)
      .where(eq(schema.parametrosAlerta.activo, true));

    // Load all active zones for crossing
    const zonas = await this.db
      .select()
      .from(schema.zonasAlerta)
      .where(eq(schema.zonasAlerta.activo, true));

    const brotes: { parametro: any; reportes: any[]; zonaId?: number }[] = [];

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

      let reportes = await this.db
        .select()
        .from(schema.reportes)
        .where(condiciones);

      if (reportes.length < p.umbralReportes) continue;

      // Filter by radio_km: compute centroid, then keep only reports within radio_km
      if (p.radioKm > 0) {
        const centro = this.calcularCentroide(reportes);
        if (centro.lat !== 0 || centro.lon !== 0) {
          reportes = reportes.filter(
            (r) =>
              r.latitud != null &&
              r.longitud != null &&
              this.haversineKm(centro.lat, centro.lon, r.latitud, r.longitud) <= p.radioKm,
          );
        }
      }

      if (reportes.length < p.umbralReportes) continue;

      // Cross with zones: find which zona contains the centroid
      let zonaId: number | undefined;
      if (reportes.length > 0) {
        const centro = this.calcularCentroide(reportes);
        for (const z of zonas) {
          const dist = this.haversineKm(
            centro.lat, centro.lon,
            z.latitudCentro, z.longitudCentro,
          );
          if (dist <= z.radioKm) {
            zonaId = z.id;
            break;
          }
        }
      }

      brotes.push({ parametro: p, reportes, zonaId });
    }

    return brotes;
  }
}
