-- Migración 0021: Tabla pivote tratamiento_cultivos
-- Permite que un tratamiento oficial aplique a múltiples cultivos

CREATE TABLE IF NOT EXISTS tratamiento_cultivos (
  id SERIAL PRIMARY KEY,
  tratamiento_id INTEGER NOT NULL REFERENCES tratamientos_oficiales(id) ON DELETE CASCADE,
  cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
  UNIQUE(tratamiento_id, cultivo_id)
);

-- Migrar datos existentes: cada tratamiento con cultivoId → pivote
INSERT INTO tratamiento_cultivos (tratamiento_id, cultivo_id)
SELECT id, cultivo_id FROM tratamientos_oficiales
WHERE cultivo_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Hacer cultivo_id nullable (migración progresiva)
ALTER TABLE tratamientos_oficiales ALTER COLUMN cultivo_id DROP NOT NULL;
