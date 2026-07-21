-- Migración 0022: Agregar nombre y descripcion a tratamientos_oficiales

ALTER TABLE tratamientos_oficiales ADD COLUMN IF NOT EXISTS nombre varchar(200);
ALTER TABLE tratamientos_oficiales ADD COLUMN IF NOT EXISTS descripcion text;
