CREATE TABLE "reportes" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"usuario_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL,
	"imagenes_urls" jsonb NOT NULL,
	"audio_url" varchar(500),
	"latitud" double precision NOT NULL,
	"longitud" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE no action ON UPDATE no action;