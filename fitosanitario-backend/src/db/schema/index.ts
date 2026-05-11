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
  id:          serial('id').primaryKey(),
  titulo:      varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  usuarioId:   integer('usuario_id').notNull().references(() => usuarios.id),
  cultivoId:   integer('cultivo_id').notNull().references(() => cultivos.id),
  imagenesUrls: jsonb('imagenes_urls').$type<string[]>().notNull(),
  audioUrl:    varchar('audio_url', { length: 500 }),
  latitud:     doublePrecision('latitud').notNull(),
  longitud:    doublePrecision('longitud').notNull(),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});