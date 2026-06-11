CREATE TYPE "public"."estado_reporte" AS ENUM('PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO');--> statement-breakpoint
CREATE TABLE "reporte_historial_estado" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporte_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"estado_anterior" "estado_reporte",
	"estado_nuevo" "estado_reporte" NOT NULL,
	"motivo" text,
	"fecha_cambio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reporte_historial_estado" ADD CONSTRAINT "reporte_historial_estado_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporte_historial_estado" ADD CONSTRAINT "reporte_historial_estado_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;