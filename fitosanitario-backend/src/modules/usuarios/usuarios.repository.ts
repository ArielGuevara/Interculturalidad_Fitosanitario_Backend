import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../db/db.module';

@Injectable()
export class UsuariosRepository {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.usuarios);
  }

  async findByRole(roles: string[]) {
    return this.db
      .select()
      .from(schema.usuarios)
      .where(inArray(schema.usuarios.rol, roles as any));
  }

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async findByTelefono(telefono: string) {
    const normalized = telefono.replace(/[^0-9]/g, '').replace(/^(593|0)/, '');
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(sql`REGEXP_REPLACE(${schema.usuarios.telefono}, '[^0-9]', '', 'g') LIKE ${'%' + normalized}`)
      .limit(1);
    return result[0] ?? null;
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async update(id: number, data: Partial<{
    nombre: string;
    email: string;
    telefono: string | null;
    cargo: string | null;
    rol: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN';
    activo: boolean;
    permisos: string[];
  }>) {
    const [result] = await this.db
      .update(schema.usuarios)
      .set(data as any)
      .where(eq(schema.usuarios.id, id))
      .returning();
    return result ?? null;
  }

  async updatePassword(id: number, passwordHash: string) {
    await this.db
      .update(schema.usuarios)
      .set({ passwordHash })
      .where(eq(schema.usuarios.id, id));
  }

  async create(data: {
    nombre: string;
    email: string;
    telefono?: string | null;
    passwordHash: string;
    rol?: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN';
    cargo?: string | null;
    permisos?: string[];
  }) {
    const result = await this.db
      .insert(schema.usuarios)
      .values(data)
      .returning();
    return result[0];
  }

  async createSuspension(params: {
    usuarioId: number;
    reporteId?: number | null;
    motivo: string;
    tipoDuracion: 'TIEMPO' | 'DIAS';
    duracion: number;
    fechaFin: Date;
  }) {
    const [result] = await this.db
      .insert(schema.suspensionesUsuarios)
      .values({
        usuarioId: params.usuarioId,
        reporteId: params.reporteId ?? null,
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

  async desactivarSuspension(id: number) {
    const [result] = await this.db
      .update(schema.suspensionesUsuarios)
      .set({ activa: false })
      .where(eq(schema.suspensionesUsuarios.id, id))
      .returning();
    return result;
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

  async findAllActiveSuspensions() {
    await this.desactivarSuspensionesExpiradas();
    return this.db
      .select()
      .from(schema.suspensionesUsuarios)
      .where(
        and(
          eq(schema.suspensionesUsuarios.activa, true),
          sql`${schema.suspensionesUsuarios.fechaFin} > NOW()`,
        ),
      );
  }
}
