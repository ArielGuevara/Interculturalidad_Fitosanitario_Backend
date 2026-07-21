import { relations } from "drizzle-orm/relations";
import { reportes, reporteHistorialEstado, usuarios, cultivos, plagasEnfermedades, tratamientosOficiales, productosFitosanitarios, comentariosForo, recomendacionesComunidad, valoraciones } from "./schema";

export const reporteHistorialEstadoRelations = relations(reporteHistorialEstado, ({one}) => ({
	reporte: one(reportes, {
		fields: [reporteHistorialEstado.reporteId],
		references: [reportes.id]
	}),
	usuario: one(usuarios, {
		fields: [reporteHistorialEstado.usuarioId],
		references: [usuarios.id]
	}),
}));

export const reportesRelations = relations(reportes, ({one, many}) => ({
	reporteHistorialEstados: many(reporteHistorialEstado),
	usuario: one(usuarios, {
		fields: [reportes.usuarioId],
		references: [usuarios.id]
	}),
	cultivo: one(cultivos, {
		fields: [reportes.cultivoId],
		references: [cultivos.id]
	}),
	plagasEnfermedade: one(plagasEnfermedades, {
		fields: [reportes.plagaId],
		references: [plagasEnfermedades.id]
	}),
	tratamientosOficiales: many(tratamientosOficiales),
	recomendacionesComunidads: many(recomendacionesComunidad),
}));

export const usuariosRelations = relations(usuarios, ({many}) => ({
	reporteHistorialEstados: many(reporteHistorialEstado),
	reportes: many(reportes),
	tratamientosOficiales: many(tratamientosOficiales),
	comentariosForos_usuarioId: many(comentariosForo, {
		relationName: "comentariosForo_usuarioId_usuarios_id"
	}),
	comentariosForos_moderadoPor: many(comentariosForo, {
		relationName: "comentariosForo_moderadoPor_usuarios_id"
	}),
	recomendacionesComunidads: many(recomendacionesComunidad),
	valoraciones: many(valoraciones),
}));

export const cultivosRelations = relations(cultivos, ({many}) => ({
	reportes: many(reportes),
	tratamientosOficiales: many(tratamientosOficiales),
	recomendacionesComunidads: many(recomendacionesComunidad),
}));

export const plagasEnfermedadesRelations = relations(plagasEnfermedades, ({many}) => ({
	reportes: many(reportes),
	tratamientosOficiales: many(tratamientosOficiales),
	recomendacionesComunidads: many(recomendacionesComunidad),
}));

export const tratamientosOficialesRelations = relations(tratamientosOficiales, ({one}) => ({
	reporte: one(reportes, {
		fields: [tratamientosOficiales.reporteId],
		references: [reportes.id]
	}),
	usuario: one(usuarios, {
		fields: [tratamientosOficiales.moderadorId],
		references: [usuarios.id]
	}),
	cultivo: one(cultivos, {
		fields: [tratamientosOficiales.cultivoId],
		references: [cultivos.id]
	}),
	plagasEnfermedade: one(plagasEnfermedades, {
		fields: [tratamientosOficiales.plagaId],
		references: [plagasEnfermedades.id]
	}),
	productosFitosanitario: one(productosFitosanitarios, {
		fields: [tratamientosOficiales.productoId],
		references: [productosFitosanitarios.id]
	}),
}));

export const productosFitosanitariosRelations = relations(productosFitosanitarios, ({many}) => ({
	tratamientosOficiales: many(tratamientosOficiales),
}));

export const comentariosForoRelations = relations(comentariosForo, ({one}) => ({
	usuario_usuarioId: one(usuarios, {
		fields: [comentariosForo.usuarioId],
		references: [usuarios.id],
		relationName: "comentariosForo_usuarioId_usuarios_id"
	}),
	usuario_moderadoPor: one(usuarios, {
		fields: [comentariosForo.moderadoPor],
		references: [usuarios.id],
		relationName: "comentariosForo_moderadoPor_usuarios_id"
	}),
	recomendacionesComunidad: one(recomendacionesComunidad, {
		fields: [comentariosForo.recomendacionId],
		references: [recomendacionesComunidad.id]
	}),
}));

export const recomendacionesComunidadRelations = relations(recomendacionesComunidad, ({one, many}) => ({
	comentariosForos: many(comentariosForo),
	reporte: one(reportes, {
		fields: [recomendacionesComunidad.reporteId],
		references: [reportes.id]
	}),
	usuario: one(usuarios, {
		fields: [recomendacionesComunidad.usuarioId],
		references: [usuarios.id]
	}),
	cultivo: one(cultivos, {
		fields: [recomendacionesComunidad.cultivoId],
		references: [cultivos.id]
	}),
	plagasEnfermedade: one(plagasEnfermedades, {
		fields: [recomendacionesComunidad.plagaId],
		references: [plagasEnfermedades.id]
	}),
	valoraciones: many(valoraciones),
}));

export const valoracionesRelations = relations(valoraciones, ({one}) => ({
	recomendacionesComunidad: one(recomendacionesComunidad, {
		fields: [valoraciones.recomendacionId],
		references: [recomendacionesComunidad.id]
	}),
	usuario: one(usuarios, {
		fields: [valoraciones.usuarioId],
		references: [usuarios.id]
	}),
}));