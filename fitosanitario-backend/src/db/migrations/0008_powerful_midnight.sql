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
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_zona_id_zonas_alerta_id_fk" FOREIGN KEY ("zona_id") REFERENCES "public"."zonas_alerta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_parametro_id_parametros_alerta_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros_alerta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_alerta_id_alertas_id_fk" FOREIGN KEY ("alerta_id") REFERENCES "public"."alertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_alerta" ADD CONSTRAINT "parametros_alerta_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_alerta" ADD CONSTRAINT "parametros_alerta_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;