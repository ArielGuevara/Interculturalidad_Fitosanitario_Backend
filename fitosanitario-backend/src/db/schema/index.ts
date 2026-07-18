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
  date,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────
export const rolUsuarioEnum = pgEnum('rol_usuario', [
  'AGRICULTOR',
  'MODERADOR',
  'ADMIN',
]);

export const tipoPlagaEnum = pgEnum('tipo_plaga', [
  'PLAGA',
  'ENFERMEDAD',
  'MALEZA',
]);

export const tipoProductoEnum = pgEnum('tipo_producto', [
  'INSECTICIDA',
  'FUNGICIDA',
  'HERBICIDA',
  'BIOLOGICO',
]);

export const metodoAplicacionEnum = pgEnum('metodo_aplicacion', [
  'FOLIAR',
  'SUELO',
  'RIEGO',
]);

export const estadoReporteEnum = pgEnum('estado_reporte', [
  'PENDIENTE',
  'COMUNIDAD',
  'VALIDADO',
  'RECHAZADO',
  'VOLVER_A_REPORTAR',
]);

export const tipoDuracionSuspensionEnum = pgEnum('tipo_duracion_suspension', [
  'TIEMPO',
  'DIAS',
]);

// ── Tabla: USUARIO ─────────────────────────────────────────
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  telefono: varchar('telefono', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  rol: rolUsuarioEnum('rol').notNull().default('AGRICULTOR'),
  fechaRegistro: timestamp('fecha_registro').notNull().defaultNow(),
});

// ── Tabla: CULTIVO ─────────────────────────────────────────
export const cultivos = pgTable('cultivos', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  imagenUrl: varchar('imagen_url', { length: 500 }),
});

// ── Tabla: PLAGA_ENFERMEDAD ────────────────────────────────
export const plagasEnfermedades = pgTable('plagas_enfermedades', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  tipo: tipoPlagaEnum('tipo').notNull(),
  descripcion: text('descripcion'),
  imagenUrl: varchar('imagen_url', { length: 500 }),
});

// ── Tabla: PRODUCTO_FITOSANITARIO ──────────────────────────
export const productosFitosanitarios = pgTable('productos_fitosanitarios', {
  id: serial('id').primaryKey(),
  nombreComercial: varchar('nombre_comercial', { length: 150 }).notNull(),
  ingredienteActivo: varchar('ingrediente_activo', { length: 200 }),
  tipo: tipoProductoEnum('tipo').notNull(),
  unidadBase: varchar('unidad_base', { length: 50 }),
});

// ── Tabla: REPORTES ───────────────────────────────────────
export const reportes = pgTable('reportes', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  descripcionProblema: text('descripcion_problema'),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  cultivoId: integer('cultivo_id')
    .notNull()
    .references(() => cultivos.id),
  plagaId: integer('plaga_id').references(() => plagasEnfermedades.id),
  imagenesUrls: jsonb('imagenes_urls').$type<string[]>().notNull().default([]),
  audioUrl: varchar('audio_url', { length: 500 }),
  latitud: doublePrecision('latitud').notNull(),
  longitud: doublePrecision('longitud').notNull(),
  estado: estadoReporteEnum('estado').notNull().default('PENDIENTE'),
  sincronizado: boolean('sincronizado').notNull().default(true),
  motivoRechazo: text('motivo_rechazo'),
  audioRechazoUrl: varchar('audio_rechazo_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: REPORTE_HISTORIAL_ESTADO ───────────────────────
export const reporteHistorialEstado = pgTable('reporte_historial_estado', {
  id: serial('id').primaryKey(),
  reporteId: integer('reporte_id')
    .notNull()
    .references(() => reportes.id, { onDelete: 'cascade' }),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  estadoAnterior: estadoReporteEnum('estado_anterior'),
  estadoNuevo: estadoReporteEnum('estado_nuevo').notNull(),
  motivo: text('motivo'),
  fechaCambio: timestamp('fecha_cambio').notNull().defaultNow(),
});

// ── Tabla: SUSPENSIONES_USUARIOS ───────────────────────────
export const suspensionesUsuarios = pgTable('suspensiones_usuarios', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  reporteId: integer('reporte_id')
    .notNull()
    .references(() => reportes.id),
  motivo: text('motivo').notNull(),
  tipoDuracion: tipoDuracionSuspensionEnum('tipo_duracion').notNull(),
  duracion: integer('duracion').notNull(),
  fechaInicio: timestamp('fecha_inicio').notNull().defaultNow(),
  fechaFin: timestamp('fecha_fin').notNull(),
  activa: boolean('activa').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: PLAGA_CULTIVO (N:N) ─────────────────────────────
export const plagasCultivos = pgTable('plagas_cultivos', {
  id: serial('id').primaryKey(),
  plagaId: integer('plaga_id')
    .notNull()
    .references(() => plagasEnfermedades.id, { onDelete: 'cascade' }),
  cultivoId: integer('cultivo_id')
    .notNull()
    .references(() => cultivos.id, { onDelete: 'cascade' }),
});

// ── Tabla: PRODUCTO_CULTIVO (N:N) ──────────────────────────
export const productosCultivos = pgTable('productos_cultivos', {
  id: serial('id').primaryKey(),
  productoId: integer('producto_id')
    .notNull()
    .references(() => productosFitosanitarios.id, { onDelete: 'cascade' }),
  cultivoId: integer('cultivo_id')
    .notNull()
    .references(() => cultivos.id, { onDelete: 'cascade' }),
});

// ── Tabla: PRODUCTO_PLAGA_CULTIVO (tripartita) ─────────────
export const productosPlagasCultivos = pgTable('productos_plagas_cultivos', {
  id: serial('id').primaryKey(),
  productoId: integer('producto_id')
    .notNull()
    .references(() => productosFitosanitarios.id, { onDelete: 'cascade' }),
  plagaId: integer('plaga_id')
    .notNull()
    .references(() => plagasEnfermedades.id, { onDelete: 'cascade' }),
  cultivoId: integer('cultivo_id')
    .notNull()
    .references(() => cultivos.id, { onDelete: 'cascade' }),
});

// ── Tabla: TRATAMIENTO_OFICIAL ─────────────────────────────
export const tratamientosOficiales = pgTable('tratamientos_oficiales', {
  id: serial('id').primaryKey(),
  reporteId: integer('reporte_id').references(() => reportes.id),
  recomendacionOrigenId: integer('recomendacion_origen_id'), // FK a comunidad, se agrega en Sprint 4
  moderadorId: integer('moderador_id')
    .notNull()
    .references(() => usuarios.id),
  cultivoId: integer('cultivo_id')
    .notNull()
    .references(() => cultivos.id),
  plagaId: integer('plaga_id')
    .notNull()
    .references(() => plagasEnfermedades.id),
  productoId: integer('producto_id')
    .notNull()
    .references(() => productosFitosanitarios.id),

  dosis: doublePrecision('dosis').notNull(),
  unidadDosis: varchar('unidad_dosis', { length: 50 }).notNull(),

  volumenAgua: doublePrecision('volumen_agua'),
  unidadVolumen: varchar('unidad_volumen', { length: 50 }),

  metodoAplicacion: metodoAplicacionEnum('metodo_aplicacion').notNull(),

  intervaloDias: integer('intervalo_dias').notNull(),
  numeroAplicaciones: integer('numero_aplicaciones').notNull(),
  duracionTotalDias: integer('duracion_total_dias').notNull(),

  diasCarencia: integer('dias_carencia').notNull(),
  periodoReingresoHoras: integer('periodo_reingreso_horas'),

  etapaCultivo: varchar('etapa_cultivo', { length: 100 }),
  condicionesAplicacion: text('condiciones_aplicacion'),

  enEnciclopedia: boolean('en_enciclopedia').notNull().default(false),
  fechaValidacion: timestamp('fecha_validacion').notNull().defaultNow(),
  fechaUltimaActualizacion: timestamp('fecha_ultima_actualizacion')
    .notNull()
    .defaultNow(),
});

// ── Enum: TIPO_RECOMENDACION ────────────────────────────────
export const tipoRecomendacionEnum = pgEnum('tipo_recomendacion', [
  'RECOMENDACION',
  'CONSULTA',
  'CONOCIMIENTO_ANCESTRAL',
]);

// ── Tabla: RECOMENDACION_COMUNIDAD ──────────────────────────
export const recomendacionesComunidad = pgTable('recomendaciones_comunidad', {
  id: serial('id').primaryKey(),
  reporteId: integer('reporte_id').references(() => reportes.id),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  cultivoId: integer('cultivo_id').references(() => cultivos.id),
  plagaId: integer('plaga_id').references(() => plagasEnfermedades.id),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion').notNull(),
  tipo: tipoRecomendacionEnum('tipo').notNull().default('RECOMENDACION'),
  valoracionPromedio: doublePrecision('valoracion_promedio')
    .notNull()
    .default(0),
  totalValoraciones: integer('total_valoraciones').notNull().default(0),
  moderado: boolean('moderado').notNull().default(false),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Tabla: VALORACION ───────────────────────────────────────
export const valoraciones = pgTable('valoraciones', {
  id: serial('id').primaryKey(),
  recomendacionId: integer('recomendacion_id')
    .notNull()
    .references(() => recomendacionesComunidad.id, { onDelete: 'cascade' }),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  puntuacion: integer('puntuacion').notNull(),
  comentario: text('comentario'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: COMENTARIO_FORO ─────────────────────────────────
export const comentariosForo = pgTable('comentarios_foro', {
  id: serial('id').primaryKey(),
  recomendacionId: integer('recomendacion_id')
    .notNull()
    .references(() => recomendacionesComunidad.id, { onDelete: 'cascade' }),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  comentarioPadreId: integer('comentario_padre_id'),
  contenido: text('contenido').notNull(),
  audioUrl: varchar('audio_url', { length: 500 }),
  activo: boolean('activo').notNull().default(true),
  moderadoPor: integer('moderado_por').references(() => usuarios.id),
  fechaModeracion: timestamp('fecha_moderacion'),
  fechaComentario: timestamp('fecha_comentario').notNull().defaultNow(),
});

// ── Tabla: DISPOSITIVOS (Push Tokens) ───────────────────────
export const dispositivos = pgTable('dispositivos', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull(),
  plataforma: varchar('plataforma', { length: 20 }).notNull(), // 'ios' | 'android'
  activo: boolean('activo').notNull().default(true),
  ultimoUso: timestamp('ultimo_uso').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: ZONAS_ALERTA ─────────────────────────────────────
export const zonasAlerta = pgTable('zonas_alerta', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  descripcion: text('descripcion'),
  latitudCentro: doublePrecision('latitud_centro').notNull(),
  longitudCentro: doublePrecision('longitud_centro').notNull(),
  radioKm: doublePrecision('radio_km').notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Tabla: PARAMETROS_ALERTA ────────────────────────────────
export const parametrosAlerta = pgTable('parametros_alerta', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  plagaId: integer('plaga_id').references(() => plagasEnfermedades.id),
  cultivoId: integer('cultivo_id').references(() => cultivos.id),
  umbralReportes: integer('umbral_reportes').notNull().default(3),
  radioKm: doublePrecision('radio_km').notNull().default(10),
  ventanaHoras: integer('ventana_horas').notNull().default(72),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: ALERTAS ──────────────────────────────────────────
export const alertas = pgTable('alertas', {
  id: serial('id').primaryKey(),
  zonaId: integer('zona_id').references(() => zonasAlerta.id),
  parametroId: integer('parametro_id').references(() => parametrosAlerta.id),
  plagaId: integer('plaga_id').references(() => plagasEnfermedades.id),
  cultivoId: integer('cultivo_id').references(() => cultivos.id),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion').notNull(),
  nivel: varchar('nivel', { length: 20 }).notNull().default('MEDIO'), // BAJO | MEDIO | ALTO | CRITICO
  latitud: doublePrecision('latitud'),
  longitud: doublePrecision('longitud'),
  totalReportes: integer('total_reportes').notNull().default(0),
  leida: boolean('leida').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: NOTIFICACIONES ───────────────────────────────────
export const notificaciones = pgTable('notificaciones', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  alertaId: integer('alerta_id').references(() => alertas.id),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  cuerpo: text('cuerpo').notNull(),
  leida: boolean('leida').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Tabla: RESET_TOKENS ──────────────────────────────────────
export const resetTokens = pgTable('reset_tokens', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  codigo: varchar('codigo', { length: 6 }).notNull(),
  telefono: varchar('telefono', { length: 20 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usado: boolean('usado').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
