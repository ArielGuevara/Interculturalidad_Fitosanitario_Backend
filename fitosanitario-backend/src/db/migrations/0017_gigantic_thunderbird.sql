ALTER TABLE "suspensiones_usuarios" ALTER COLUMN "reporte_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "cargo" varchar(100);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "activo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "permisos" jsonb DEFAULT '[]'::jsonb NOT NULL;