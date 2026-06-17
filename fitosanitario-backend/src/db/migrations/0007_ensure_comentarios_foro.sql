CREATE TABLE IF NOT EXISTS "comentarios_foro" (
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
DO $$ BEGIN
  ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_moderado_por_usuarios_id_fk" FOREIGN KEY ("moderado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
