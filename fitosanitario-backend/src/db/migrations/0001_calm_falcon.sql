CREATE TYPE "public"."tipo_duracion_suspension" AS ENUM('TIEMPO', 'DIAS');--> statement-breakpoint
ALTER TYPE "public"."estado_reporte" ADD VALUE 'VOLVER_A_REPORTAR';--> statement-breakpoint
ALTER TYPE "public"."rol_usuario" ADD VALUE 'ADMIN';--> statement-breakpoint
CREATE TABLE "alertas" (
	"id" serial PRIMARY KEY NOT NULL,
	"zona_id" integer,
	"parametro_id" integer,
	"plaga_id" integer,
	"cultivo_id" integer,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text NOT NULL,
	"nivel" varchar(20) DEFAULT 'MEDIO' NOT NULL,
	"latitud" double precision,
	"longitud" double precision,
	"total_reportes" integer DEFAULT 0 NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispositivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"token" varchar(500) NOT NULL,
	"plataforma" varchar(20) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"ultimo_uso" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"alerta_id" integer,
	"titulo" varchar(200) NOT NULL,
	"cuerpo" text NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parametros_alerta" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"plaga_id" integer,
	"cultivo_id" integer,
	"umbral_reportes" integer DEFAULT 3 NOT NULL,
	"radio_km" double precision DEFAULT 10 NOT NULL,
	"ventana_horas" integer DEFAULT 72 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plagas_cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaga_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos_cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"producto_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos_plagas_cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"producto_id" integer NOT NULL,
	"plaga_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"codigo" varchar(6) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"usado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "zonas_alerta" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"latitud_centro" double precision NOT NULL,
	"longitud_centro" double precision NOT NULL,
	"radio_km" double precision NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" DROP CONSTRAINT "tratamientos_oficiales_producto_id_productos_fitosanitarios_id_";
--> statement-breakpoint
ALTER TABLE "comentarios_foro" DROP CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_";
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "telefono" varchar(20);--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "motivo_rechazo" text;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "audio_rechazo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD COLUMN "audio_url" varchar(500);--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_zona_id_zonas_alerta_id_fk" FOREIGN KEY ("zona_id") REFERENCES "public"."zonas_alerta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_parametro_id_parametros_alerta_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros_alerta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_alerta_id_alertas_id_fk" FOREIGN KEY ("alerta_id") REFERENCES "public"."alertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_alerta" ADD CONSTRAINT "parametros_alerta_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_alerta" ADD CONSTRAINT "parametros_alerta_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plagas_cultivos" ADD CONSTRAINT "plagas_cultivos_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plagas_cultivos" ADD CONSTRAINT "plagas_cultivos_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_cultivos" ADD CONSTRAINT "productos_cultivos_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_cultivos" ADD CONSTRAINT "productos_cultivos_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reset_tokens" ADD CONSTRAINT "reset_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensiones_usuarios" ADD CONSTRAINT "suspensiones_usuarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensiones_usuarios" ADD CONSTRAINT "suspensiones_usuarios_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_recomendacion_id_recomendaciones_comunidad_id_fk" FOREIGN KEY ("recomendacion_id") REFERENCES "public"."recomendaciones_comunidad"("id") ON DELETE cascade ON UPDATE no action;