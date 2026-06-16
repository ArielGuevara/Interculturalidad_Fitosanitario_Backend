CREATE TYPE "public"."metodo_aplicacion" AS ENUM('FOLIAR', 'SUELO', 'RIEGO');--> statement-breakpoint
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
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_moderador_id_usuarios_id_fk" FOREIGN KEY ("moderador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos_oficiales" ADD CONSTRAINT "tratamientos_oficiales_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE no action ON UPDATE no action;