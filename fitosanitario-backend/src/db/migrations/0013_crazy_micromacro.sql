CREATE TABLE "productos_plagas_cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"producto_id" integer NOT NULL,
	"plaga_id" integer NOT NULL,
	"cultivo_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_producto_id_productos_fitosanitarios_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_fitosanitarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_plaga_id_plagas_enfermedades_id_fk" FOREIGN KEY ("plaga_id") REFERENCES "public"."plagas_enfermedades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_plagas_cultivos" ADD CONSTRAINT "productos_plagas_cultivos_cultivo_id_cultivos_id_fk" FOREIGN KEY ("cultivo_id") REFERENCES "public"."cultivos"("id") ON DELETE cascade ON UPDATE no action;