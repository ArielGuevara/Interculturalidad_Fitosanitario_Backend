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

export const metodoAplicacionEnum = pgEnum('metodo_aplicacion', [
  'FOLIAR', 'SUELO', 'RIEGO',
]);

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


// ── Tabla: TRATAMIENTO_OFICIAL ─────────────────────────────
export const tratamientosOficiales = pgTable('tratamientos_oficiales', {
  id:                    serial('id').primaryKey(),
  reporteId:             integer('reporte_id').references(() => reportes.id),
  recomendacionOrigenId: integer('recomendacion_origen_id'), // FK a comunidad, se agrega en Sprint 4
  moderadorId:           integer('moderador_id').notNull().references(() => usuarios.id),
  cultivoId:             integer('cultivo_id').notNull().references(() => cultivos.id),
  plagaId:               integer('plaga_id').notNull().references(() => plagasEnfermedades.id),
  productoId:            integer('producto_id').notNull().references(() => productosFitosanitarios.id),

  dosis:                 doublePrecision('dosis').notNull(),
  unidadDosis:           varchar('unidad_dosis', { length: 50 }).notNull(),

  volumenAgua:           doublePrecision('volumen_agua'),
  unidadVolumen:         varchar('unidad_volumen', { length: 50 }),

  metodoAplicacion:      metodoAplicacionEnum('metodo_aplicacion').notNull(),

  intervaloDias:         integer('intervalo_dias').notNull(),
  numeroAplicaciones:    integer('numero_aplicaciones').notNull(),
  duracionTotalDias:     integer('duracion_total_dias').notNull(),

  diasCarencia:          integer('dias_carencia').notNull(),
  periodoReingresoHoras: integer('periodo_reingreso_horas'),

  etapaCultivo:          varchar('etapa_cultivo', { length: 100 }),
  condicionesAplicacion: text('condiciones_aplicacion'),

  enEnciclopedia:           boolean('en_enciclopedia').notNull().default(false),
  fechaValidacion:          timestamp('fecha_validacion').notNull().defaultNow(),
  fechaUltimaActualizacion: timestamp('fecha_ultima_actualizacion').notNull().defaultNow(),
});

// ── Tabla: RECOMENDACION_COMUNIDAD ─────────────────────────
export const recomendacionesComunidad = pgTable('recomendaciones_comunidad', {
  id:                  serial('id').primaryKey(),
  reporteId:           integer('reporte_id').notNull().references(() => reportes.id),
  usuarioId:           integer('usuario_id').notNull().references(() => usuarios.id),

  productoId:          integer('producto_id').references(() => productosFitosanitarios.id),
  productoNombreLibre: varchar('producto_nombre_libre', { length: 150 }),

  dosis:               doublePrecision('dosis').notNull(),
  unidadDosis:         varchar('unidad_dosis', { length: 50 }).notNull(),

  intervaloDias:       integer('intervalo_dias').notNull(),
  numeroAplicaciones:  integer('numero_aplicaciones').notNull(),
  duracionTotalDias:   integer('duracion_total_dias').notNull(),

  metodoAplicacion:    varchar('metodo_aplicacion', { length: 50 }),
  observaciones:       text('observaciones'),

  activo:              boolean('activo').notNull().default(true),
  moderadoPor:         integer('moderado_por').references(() => usuarios.id),
  fechaModeracion:     timestamp('fecha_moderacion'),
  fechaAporte:         timestamp('fecha_aporte').notNull().defaultNow(),
});

// ── Tabla: VALORACION_RECOMENDACION ────────────────────────
export const valoracionesRecomendacion = pgTable('valoraciones_recomendacion', {
  id:               serial('id').primaryKey(),
  recomendacionId:  integer('recomendacion_id').notNull().references(() => recomendacionesComunidad.id, { onDelete: 'cascade' }),
  usuarioId:        integer('usuario_id').notNull().references(() => usuarios.id),
  puntuacion:       integer('puntuacion').notNull(), // 1 a 5
  fechaValoracion:  timestamp('fecha_valoracion').notNull().defaultNow(),
});

// ── Tabla: COMENTARIO_FORO ─────────────────────────────────
export const comentariosForo = pgTable('comentarios_foro', {
  id:                serial('id').primaryKey(),
  recomendacionId:   integer('recomendacion_id').notNull().references(() => recomendacionesComunidad.id, { onDelete: 'cascade' }),
  usuarioId:         integer('usuario_id').notNull().references(() => usuarios.id),
  comentarioPadreId: integer('comentario_padre_id'), // recursivo, sin FK directa para evitar circular
  contenido:         text('contenido').notNull(),
  activo:            boolean('activo').notNull().default(true),
  moderadoPor:       integer('moderado_por').references(() => usuarios.id),
  fechaModeracion:   timestamp('fecha_moderacion'),
  fechaComentario:   timestamp('fecha_comentario').notNull().defaultNow(),
});