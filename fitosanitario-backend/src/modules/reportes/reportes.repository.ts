import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { ReEditarReporteDto } from './dto/re-editar-reporte.dto';

@Injectable()
export class ReportesRepository {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(params: {
    titulo: string;
    descripcion?: string;
    descripcionProblema?: string;
    usuarioId: number;
    cultivoId: number;
    plagaId?: number;
    imagenesUrls: string[];
    audioUrl?: string | null;
    latitud: number;
    longitud: number;
    sincronizado?: boolean;
  }) {
    const result = await this.db
      .insert(schema.reportes)
      .values({
        titulo: params.titulo,
        descripcion: params.descripcion ?? null,
        descripcionProblema: params.descripcionProblema ?? null,
        usuarioId: params.usuarioId,
        cultivoId: params.cultivoId,
        plagaId: params.plagaId ?? null,
        imagenesUrls: params.imagenesUrls,
        audioUrl: params.audioUrl ?? null,
        latitud: params.latitud,
        longitud: params.longitud,
        sincronizado: params.sincronizado ?? true,
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

  async findByUsuario(usuarioId: number) {
    return this.db
      .select()
      .from(schema.reportes)
      .where(eq(schema.reportes.usuarioId, usuarioId))
      .orderBy(desc(schema.reportes.createdAt));
  }

  async findPendientes() {
    return this.db
      .select()
      .from(schema.reportes)
      .where(eq(schema.reportes.estado, 'PENDIENTE'))
      .orderBy(desc(schema.reportes.createdAt));
  }

  async cambiarEstado(params: {
    reporteId: number;
    usuarioId: number;
    estadoAnterior: (typeof schema.estadoReporteEnum.enumValues)[number];
    estadoNuevo: (typeof schema.estadoReporteEnum.enumValues)[number];
    motivo?: string;
  }) {
    const [reporteActualizado] = await this.db
      .update(schema.reportes)
      .set({ estado: params.estadoNuevo })
      .where(eq(schema.reportes.id, params.reporteId))
      .returning();

    await this.db.insert(schema.reporteHistorialEstado).values({
      reporteId: params.reporteId,
      usuarioId: params.usuarioId,
      estadoAnterior: params.estadoAnterior,
      estadoNuevo: params.estadoNuevo,
      motivo: params.motivo ?? null,
    });

    return reporteActualizado;
  }

  async setMotivoRechazo(reporteId: number, motivo: string, audioUrl?: string | null) {
    const [reporteActualizado] = await this.db
      .update(schema.reportes)
      .set({
        motivoRechazo: motivo,
        audioRechazoUrl: audioUrl ?? null,
      })
      .where(eq(schema.reportes.id, reporteId))
      .returning();

    return reporteActualizado;
  }

  async reEditar(reporteId: number, dto: ReEditarReporteDto) {
    const updateData: any = {};
    if (dto.titulo !== undefined) updateData.titulo = dto.titulo;
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion;
    if (dto.cultivoId !== undefined) updateData.cultivoId = dto.cultivoId;
    if (dto.imagenesUrls !== undefined) updateData.imagenesUrls = dto.imagenesUrls;
    if (dto.audioUrl !== undefined) updateData.audioUrl = dto.audioUrl;

    const [reporteActualizado] = await this.db
      .update(schema.reportes)
      .set(updateData)
      .where(eq(schema.reportes.id, reporteId))
      .returning();

    return reporteActualizado;
  }

  async getHistorial(reporteId: number) {
    return this.db
      .select({
        id: schema.reporteHistorialEstado.id,
        estadoAnterior: schema.reporteHistorialEstado.estadoAnterior,
        estadoNuevo: schema.reporteHistorialEstado.estadoNuevo,
        motivo: schema.reporteHistorialEstado.motivo,
        fechaCambio: schema.reporteHistorialEstado.fechaCambio,
        usuario: {
          id: schema.usuarios.id,
          nombre: schema.usuarios.nombre,
        },
      })
      .from(schema.reporteHistorialEstado)
      .innerJoin(
        schema.usuarios,
        eq(schema.reporteHistorialEstado.usuarioId, schema.usuarios.id),
      )
      .where(eq(schema.reporteHistorialEstado.reporteId, reporteId))
      .orderBy(desc(schema.reporteHistorialEstado.fechaCambio));
  }

  async createSuspension(params: {
    usuarioId: number;
    reporteId: number;
    motivo: string;
    tipoDuracion: 'TIEMPO' | 'DIAS';
    duracion: number;
    fechaFin: Date;
  }) {
    const [result] = await this.db
      .insert(schema.suspensionesUsuarios)
      .values({
        usuarioId: params.usuarioId,
        reporteId: params.reporteId,
        motivo: params.motivo,
        tipoDuracion: params.tipoDuracion,
        duracion: params.duracion,
        fechaFin: params.fechaFin,
      })
      .returning();

    return result;
  }

  async findSuspensionActiva(usuarioId: number) {
    const result = await this.db
      .select()
      .from(schema.suspensionesUsuarios)
      .where(
        and(
          eq(schema.suspensionesUsuarios.usuarioId, usuarioId),
          eq(schema.suspensionesUsuarios.activa, true),
          sql`${schema.suspensionesUsuarios.fechaFin} > NOW()`,
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async desactivarSuspensionesExpiradas() {
    await this.db
      .update(schema.suspensionesUsuarios)
      .set({ activa: false })
      .where(
        and(
          eq(schema.suspensionesUsuarios.activa, true),
          sql`${schema.suspensionesUsuarios.fechaFin} <= NOW()`,
        ),
      );
  }
}
