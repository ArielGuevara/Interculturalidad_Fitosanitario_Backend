import { pgTable, serial, varchar, unique, timestamp, text, foreignKey, integer, doublePrecision, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const estadoReporte = pgEnum("estado_reporte", ['PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO'])
export const metodoAplicacion = pgEnum("metodo_aplicacion", ['FOLIAR', 'SUELO', 'RIEGO'])
export const rolUsuario = pgEnum("rol_usuario", ['AGRICULTOR', 'MODERADOR'])
export const tipoPlaga = pgEnum("tipo_plaga", ['PLAGA', 'ENFERMEDAD', 'MALEZA'])
export const tipoProducto = pgEnum("tipo_producto", ['INSECTICIDA', 'FUNGICIDA', 'HERBICIDA', 'BIOLOGICO'])
export const tipoRecomendacion = pgEnum("tipo_recomendacion", ['RECOMENDACION', 'CONSULTA', 'CONOCIMIENTO_ANCESTRAL'])


export const productosFitosanitarios = pgTable("productos_fitosanitarios", {
	id: serial().primaryKey().notNull(),
	nombreComercial: varchar("nombre_comercial", { length: 150 }).notNull(),
	ingredienteActivo: varchar("ingrediente_activo", { length: 200 }),
	tipo: tipoProducto().notNull(),
	unidadBase: varchar("unidad_base", { length: 50 }),
});

export const usuarios = pgTable("usuarios", {
	id: serial().primaryKey().notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 150 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	rol: rolUsuario().default('AGRICULTOR').notNull(),
	fechaRegistro: timestamp("fecha_registro", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("usuarios_email_unique").on(table.email),
]);

export const cultivos = pgTable("cultivos", {
	id: serial().primaryKey().notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	descripcion: text(),
	imagenUrl: varchar("imagen_url", { length: 500 }),
});

export const reporteHistorialEstado = pgTable("reporte_historial_estado", {
	id: serial().primaryKey().notNull(),
	reporteId: integer("reporte_id").notNull(),
	usuarioId: integer("usuario_id").notNull(),
	estadoAnterior: estadoReporte("estado_anterior"),
	estadoNuevo: estadoReporte("estado_nuevo").notNull(),
	motivo: text(),
	fechaCambio: timestamp("fecha_cambio", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reporteId],
			foreignColumns: [reportes.id],
			name: "reporte_historial_estado_reporte_id_reportes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "reporte_historial_estado_usuario_id_usuarios_id_fk"
		}),
]);

export const plagasEnfermedades = pgTable("plagas_enfermedades", {
	id: serial().primaryKey().notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	tipo: tipoPlaga().notNull(),
	descripcion: text(),
	imagenUrl: varchar("imagen_url", { length: 500 }),
});

export const reportes = pgTable("reportes", {
	id: serial().primaryKey().notNull(),
	descripcion: text(),
	usuarioId: integer("usuario_id").notNull(),
	cultivoId: integer("cultivo_id").notNull(),
	audioUrl: varchar("audio_url", { length: 500 }),
	latitud: doublePrecision().notNull(),
	longitud: doublePrecision().notNull(),
	plagaId: integer("plaga_id"),
	descripcionProblema: text("descripcion_problema"),
	estado: estadoReporte().default('PENDIENTE').notNull(),
	sincronizado: boolean().default(true).notNull(),
	titulo: varchar({ length: 200 }).notNull(),
	imagenesUrls: jsonb("imagenes_urls").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "reportes_usuario_id_usuarios_id_fk"
		}),
	foreignKey({
			columns: [table.cultivoId],
			foreignColumns: [cultivos.id],
			name: "reportes_cultivo_id_cultivos_id_fk"
		}),
	foreignKey({
			columns: [table.plagaId],
			foreignColumns: [plagasEnfermedades.id],
			name: "reportes_plaga_id_plagas_enfermedades_id_fk"
		}),
]);

export const tratamientosOficiales = pgTable("tratamientos_oficiales", {
	id: serial().primaryKey().notNull(),
	reporteId: integer("reporte_id"),
	recomendacionOrigenId: integer("recomendacion_origen_id"),
	moderadorId: integer("moderador_id").notNull(),
	cultivoId: integer("cultivo_id").notNull(),
	plagaId: integer("plaga_id").notNull(),
	productoId: integer("producto_id").notNull(),
	dosis: doublePrecision().notNull(),
	unidadDosis: varchar("unidad_dosis", { length: 50 }).notNull(),
	volumenAgua: doublePrecision("volumen_agua"),
	unidadVolumen: varchar("unidad_volumen", { length: 50 }),
	metodoAplicacion: metodoAplicacion("metodo_aplicacion").notNull(),
	intervaloDias: integer("intervalo_dias").notNull(),
	numeroAplicaciones: integer("numero_aplicaciones").notNull(),
	duracionTotalDias: integer("duracion_total_dias").notNull(),
	diasCarencia: integer("dias_carencia").notNull(),
	periodoReingresoHoras: integer("periodo_reingreso_horas"),
	etapaCultivo: varchar("etapa_cultivo", { length: 100 }),
	condicionesAplicacion: text("condiciones_aplicacion"),
	enEnciclopedia: boolean("en_enciclopedia").default(false).notNull(),
	fechaValidacion: timestamp("fecha_validacion", { mode: 'string' }).defaultNow().notNull(),
	fechaUltimaActualizacion: timestamp("fecha_ultima_actualizacion", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reporteId],
			foreignColumns: [reportes.id],
			name: "tratamientos_oficiales_reporte_id_reportes_id_fk"
		}),
	foreignKey({
			columns: [table.moderadorId],
			foreignColumns: [usuarios.id],
			name: "tratamientos_oficiales_moderador_id_usuarios_id_fk"
		}),
	foreignKey({
			columns: [table.cultivoId],
			foreignColumns: [cultivos.id],
			name: "tratamientos_oficiales_cultivo_id_cultivos_id_fk"
		}),
	foreignKey({
			columns: [table.plagaId],
			foreignColumns: [plagasEnfermedades.id],
			name: "tratamientos_oficiales_plaga_id_plagas_enfermedades_id_fk"
		}),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productosFitosanitarios.id],
			name: "tratamientos_oficiales_producto_id_productos_fitosanitarios_id_"
		}),
]);

export const comentariosForo = pgTable("comentarios_foro", {
	id: serial().primaryKey().notNull(),
	recomendacionId: integer("recomendacion_id").notNull(),
	usuarioId: integer("usuario_id").notNull(),
	comentarioPadreId: integer("comentario_padre_id"),
	contenido: text().notNull(),
	activo: boolean().default(true).notNull(),
	moderadoPor: integer("moderado_por"),
	fechaModeracion: timestamp("fecha_moderacion", { mode: 'string' }),
	fechaComentario: timestamp("fecha_comentario", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "comentarios_foro_usuario_id_usuarios_id_fk"
		}),
	foreignKey({
			columns: [table.moderadoPor],
			foreignColumns: [usuarios.id],
			name: "comentarios_foro_moderado_por_usuarios_id_fk"
		}),
	foreignKey({
			columns: [table.recomendacionId],
			foreignColumns: [recomendacionesComunidad.id],
			name: "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_"
		}).onDelete("cascade"),
]);

export const recomendacionesComunidad = pgTable("recomendaciones_comunidad", {
	id: serial().primaryKey().notNull(),
	reporteId: integer("reporte_id"),
	usuarioId: integer("usuario_id").notNull(),
	activo: boolean().default(true).notNull(),
	cultivoId: integer("cultivo_id"),
	plagaId: integer("plaga_id"),
	titulo: varchar({ length: 200 }).notNull(),
	descripcion: text().notNull(),
	tipo: tipoRecomendacion().default('RECOMENDACION').notNull(),
	valoracionPromedio: doublePrecision("valoracion_promedio").default(0).notNull(),
	totalValoraciones: integer("total_valoraciones").default(0).notNull(),
	moderado: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reporteId],
			foreignColumns: [reportes.id],
			name: "recomendaciones_comunidad_reporte_id_reportes_id_fk"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "recomendaciones_comunidad_usuario_id_usuarios_id_fk"
		}),
	foreignKey({
			columns: [table.cultivoId],
			foreignColumns: [cultivos.id],
			name: "recomendaciones_comunidad_cultivo_id_cultivos_id_fk"
		}),
	foreignKey({
			columns: [table.plagaId],
			foreignColumns: [plagasEnfermedades.id],
			name: "recomendaciones_comunidad_plaga_id_plagas_enfermedades_id_fk"
		}),
]);

export const valoraciones = pgTable("valoraciones", {
	id: serial().primaryKey().notNull(),
	recomendacionId: integer("recomendacion_id").notNull(),
	usuarioId: integer("usuario_id").notNull(),
	puntuacion: integer().notNull(),
	comentario: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.recomendacionId],
			foreignColumns: [recomendacionesComunidad.id],
			name: "valoraciones_recomendacion_id_recomendaciones_comunidad_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "valoraciones_usuario_id_usuarios_id_fk"
		}),
]);
