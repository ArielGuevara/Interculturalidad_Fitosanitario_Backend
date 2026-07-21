CREATE TYPE "public"."tipo_duracion_suspension" AS ENUM('TIEMPO', 'DIAS');--> statement-breakpoint
ALTER TYPE "public"."estado_reporte" ADD VALUE 'VOLVER_A_REPORTAR';--> statement-breakpoint
CREATE TABLE "suspensiones_usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"reporte_id" integer NOT NULL,
	"motivo" text NOT NULL,
	"tipo_duracion" "tipo_duracion_suspension" NOT NULL,
	"duracion" integer NOT NULL,
	"fecha_inicio" timestamp DEFAULT now() NOT NULL,
	"fecha_fin" timestamp NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notificaciones" ADD COLUMN "es_global" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "motivo_rechazo" text;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "audio_rechazo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "suspensiones_usuarios" ADD CONSTRAINT "suspensiones_usuarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensiones_usuarios" ADD CONSTRAINT "suspensiones_usuarios_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;