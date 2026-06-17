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
	"reporte_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"producto_id" integer,
	"producto_nombre_libre" varchar(150),
	"dosis" double precision NOT NULL,
	"unidad_dosis" varchar(50) NOT NULL,
	"intervalo_dias" integer NOT NULL,
	"numero_aplicaciones" integer NOT NULL,
	"duracion_total_dias" integer NOT NULL,
	"metodo_aplicacion" varchar(50),
	"observaciones" text,
	"activo" boolean DEFAULT true NOT NULL,
	"moderado_por" integer,
	"fecha_moderacion" timestamp,
	"fecha_aporte" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valoraciones_recomendacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"recomendacion_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"puntuacion" integer NOT NULL,
	"fecha_valoracion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_moderado_por_usuarios_id_fk" FOREIGN KEY ("moderado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_moderado_por_usuarios_id_fk" FOREIGN KEY ("moderado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones_recomendacion" ADD CONSTRAINT "valoraciones_recomendacion_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones_recomendacion" ADD CONSTRAINT "valoraciones_recomendacion_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;