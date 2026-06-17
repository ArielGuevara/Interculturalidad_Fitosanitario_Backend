CREATE TYPE "public"."tipo_recomendacion" AS ENUM('RECOMENDACION', 'CONSULTA', 'CONOCIMIENTO_ANCESTRAL');--> statement-breakpoint
CREATE TABLE "comentarios_foro" (
	"id" serial PRIMARY KEY NOT NULL,
	"recomendacion_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"comentario_padre_id" integer,
	"contenido" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"moderado_por" integer,
	"fecha_moderacion" timestamp,
	"fecha_comentario" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recomendaciones_comunidad" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporte_id" integer,
	"usuario_id" integer NOT NULL,
	"cultivo_id" integer,
	"plaga_id" integer,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" "tipo_recomendacion" DEFAULT 'RECOMENDACION' NOT NULL,
	"valoracion_promedio" double precision DEFAULT 0 NOT NULL,
	"total_valoraciones" integer DEFAULT 0 NOT NULL,
	"moderado" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valoraciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"recomendacion_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"puntuacion" integer NOT NULL,
	"comentario" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_moderado_por_usuarios_id_fk" FOREIGN KEY ("moderado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones" ADD CONSTRAINT "valoraciones_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones" ADD CONSTRAINT "valoraciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;