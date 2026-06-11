ALTER TABLE "reportes" ALTER COLUMN "imagenes_urls" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "descripcion_problema" text;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "plaga_id" integer;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "estado" "estado_reporte" DEFAULT 'PENDIENTE' NOT NULL;--> statement-breakpoint
ALTER TABLE "reportes" ADD COLUMN "sincronizado" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE no action ON UPDATE no action;