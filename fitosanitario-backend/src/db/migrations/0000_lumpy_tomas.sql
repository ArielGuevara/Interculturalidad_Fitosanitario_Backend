-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."estado_reporte" AS ENUM('PENDIENTE', 'COMUNIDAD', 'VALIDADO', 'RECHAZADO');--> statement-breakpoint
CREATE TYPE "public"."metodo_aplicacion" AS ENUM('FOLIAR', 'SUELO', 'RIEGO');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('AGRICULTOR', 'MODERADOR');--> statement-breakpoint
CREATE TYPE "public"."tipo_plaga" AS ENUM('PLAGA', 'ENFERMEDAD', 'MALEZA');--> statement-breakpoint
CREATE TYPE "public"."tipo_producto" AS ENUM('INSECTICIDA', 'FUNGICIDA', 'HERBICIDA', 'BIOLOGICO');--> statement-breakpoint
CREATE TYPE "public"."tipo_recomendacion" AS ENUM('RECOMENDACION', 'CONSULTA', 'CONOCIMIENTO_ANCESTRAL');--> statement-breakpoint
CREATE TABLE "productos_fitosanitarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_comercial" varchar(150) NOT NULL,
	"ingrediente_activo" varchar(200),
	"tipo" "tipo_producto" NOT NULL,
	"unidad_base" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rol" "rol_usuario" DEFAULT 'AGRICULTOR' NOT NULL,
	"fecha_registro" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"imagen_url" varchar(500)
);
--> statement-breakpoint
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
CREATE TABLE "plagas_enfermedades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"tipo" "tipo_plaga" NOT NULL,
	"descripcion" text,
	"imagen_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "reportes" (
	"id" serial PRIMARY KEY NOT NULL,
	"descripcion" text,
	"usuario_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL,
	"audio_url" varchar(500),
	"latitud" double precision NOT NULL,
	"longitud" double precision NOT NULL,
	"plaga_id" integer,
	"descripcion_problema" text,
	"estado" "estado_reporte" DEFAULT 'PENDIENTE' NOT NULL,
	"sincronizado" boolean DEFAULT true NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"imagenes_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tratamientos_oficiales" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporte_id" integer,
	"recomendacion_origen_id" integer,
	"moderador_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL,
	"plaga_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"dosis" double precision NOT NULL,
	"unidad_dosis" varchar(50) NOT NULL,
	"volumen_agua" double precision,
	"unidad_volumen" varchar(50),
	"metodo_aplicacion" "metodo_aplicacion" NOT NULL,
	"intervalo_dias" integer NOT NULL,
	"numero_aplicaciones" integer NOT NULL,
	"duracion_total_dias" integer NOT NULL,
	"dias_carencia" integer NOT NULL,
	"periodo_reingreso_horas" integer,
	"etapa_cultivo" varchar(100),
	"condiciones_aplicacion" text,
	"en_enciclopedia" boolean DEFAULT false NOT NULL,
	"fecha_validacion" timestamp DEFAULT now() NOT NULL,
	"fecha_ultima_actualizacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"activo" boolean DEFAULT true NOT NULL,
	"cultivo_id" integer,
	"plaga_id" integer,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" "tipo_recomendacion" DEFAULT 'RECOMENDACION' NOT NULL,
	"valoracion_promedio" double precision DEFAULT 0 NOT NULL,
	"total_valoraciones" integer DEFAULT 0 NOT NULL,
	"moderado" boolean DEFAULT false NOT NULL,
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
ALTER TABLE "reporte_historial_estado" ADD CONSTRAINT "reporte_historial_estado_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporte_historial_estado" ADD CONSTRAINT "reporte_historial_estado_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_moderador_id_usuarios_id_fk" FOREIGN KEY ("moderador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_producto_id_productos_fitosanitarios_id_" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_moderado_por_usuarios_id_fk" FOREIGN KEY ("moderado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones_comunidad" ADD CONSTRAINT "recomendaciones_comunidad_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones" ADD CONSTRAINT "valoraciones_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valoraciones" ADD CONSTRAINT "valoraciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
*/