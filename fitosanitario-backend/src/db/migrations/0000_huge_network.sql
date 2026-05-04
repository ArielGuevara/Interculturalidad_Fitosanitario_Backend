CREATE TYPE "public"."rol_usuario" AS ENUM('AGRICULTOR', 'MODERADOR');--> statement-breakpoint
CREATE TYPE "public"."tipo_plaga" AS ENUM('PLAGA', 'ENFERMEDAD', 'MALEZA');--> statement-breakpoint
CREATE TYPE "public"."tipo_producto" AS ENUM('INSECTICIDA', 'FUNGICIDA', 'HERBICIDA', 'BIOLOGICO');--> statement-breakpoint
CREATE TABLE "cultivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"imagen_url" varchar(500)
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
