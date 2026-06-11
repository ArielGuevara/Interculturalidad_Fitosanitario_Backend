import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────
export const rolUsuarioEnum = pgEnum('rol_usuario', ['AGRICULTOR', 'MODERADOR']);

export const tipoPlagaEnum = pgEnum('tipo_plaga', ['PLAGA', 'ENFERMEDAD', 'MALEZA']);

export const tipoProductoEnum = pgEnum('tipo_producto', [
  'INSECTICIDA', 'FUNGICIDA', 'HERBICIDA', 'BIOLOGICO',
]);

// ── Enums nuevos ───────────────────────────────────────────
export const estadoReporteEnum = pgEnum('estado_reporte', [
  'PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO',
]);

// ── Tabla: USUARIO ─────────────────────────────────────────
export const usuarios = pgTable('usuarios', {
  id:            serial('id').primaryKey(),
  nombre:        varchar('nombre', { length: 100 }).notNull(),
  email:         varchar('email', { length: 150 }).notNull().unique(),
  passwordHash:  varchar('password_hash', { length: 255 }).notNull(),
  rol:           rolUsuarioEnum('rol').notNull().default('AGRICULTOR'),
  fechaRegistro: timestamp('fecha_registro').notNull().defaultNow(),
});

// ── Tabla: CULTIVO ─────────────────────────────────────────
export const cultivos = pgTable('cultivos', {
  id:          serial('id').primaryKey(),
  nombre:      varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  imagenUrl:   varchar('imagen_url', { length: 500 }),
});

// ── Tabla: PLAGA_ENFERMEDAD ────────────────────────────────
export const plagasEnfermedades = pgTable('plagas_enfermedades', {
  id:          serial('id').primaryKey(),
  nombre:      varchar('nombre', { length: 150 }).notNull(),
  tipo:        tipoPlagaEnum('tipo').notNull(),
  descripcion: text('descripcion'),
  imagenUrl:   varchar('imagen_url', { length: 500 }),
});

// ── Tabla: PRODUCTO_FITOSANITARIO ──────────────────────────
export const productosFitosanitarios = pgTable('productos_fitosanitarios', {
  id:                serial('id').primaryKey(),
  nombreComercial:   varchar('nombre_comercial', { length: 150 }).notNull(),
  ingredienteActivo: varchar('ingrediente_activo', { length: 200 }),
  tipo:              tipoProductoEnum('tipo').notNull(),
  unidadBase:        varchar('unidad_base', { length: 50 }),
});

// ── Tabla: REPORTES ───────────────────────────────────────
export const reportes = pgTable('reportes', {
  id:                  serial('id').primaryKey(),
  titulo:              varchar('titulo', { length: 200 }).notNull(),
  descripcion:         text('descripcion'),
  descripcionProblema: text('descripcion_problema'),
  usuarioId:           integer('usuario_id').notNull().references(() => usuarios.id),
  cultivoId:           integer('cultivo_id').notNull().references(() => cultivos.id),
  plagaId:             integer('plaga_id').references(() => plagasEnfermedades.id),
  imagenesUrls:        jsonb('imagenes_urls').$type<string[]>().notNull().default([]),
  audioUrl:            varchar('audio_url', { length: 500 }),
  latitud:             doublePrecision('latitud').notNull(),
  longitud:            doublePrecision('longitud').notNull(),
  estado:              estadoReporteEnum('estado').notNull().default('PENDIENTE'),
  sincronizado:        boolean('sincronizado').notNull().default(true),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: REPORTE_HISTORIAL_ESTADO ───────────────────────
export const reporteHistorialEstado = pgTable('reporte_historial_estado', {
  id:             serial('id').primaryKey(),
  reporteId:      integer('reporte_id').notNull().references(() => reportes.id, { onDelete: 'cascade' }),
  usuarioId:      integer('usuario_id').notNull().references(() => usuarios.id),
  estadoAnterior: estadoReporteEnum('estado_anterior'),
  estadoNuevo:    estadoReporteEnum('estado_nuevo').notNull(),
  motivo:         text('motivo'),
  fechaCambio:    timestamp('fecha_cambio').notNull().defaultNow(),
});