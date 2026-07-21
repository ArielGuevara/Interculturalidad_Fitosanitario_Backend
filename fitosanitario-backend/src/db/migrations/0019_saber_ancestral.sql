ALTER TABLE recomendaciones_comunidad
  ADD COLUMN moderador_id integer REFERENCES usuarios(id),
  ADD COLUMN motivo_rechazo text,
  ADD COLUMN fecha_expiracion timestamp,
  ADD COLUMN comentario_origen_id integer REFERENCES comentarios_foro(id),
  ADD COLUMN solucion text,
  ADD COLUMN comentario_moderador text;
