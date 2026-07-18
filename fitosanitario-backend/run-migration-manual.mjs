import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'root',
  password: 'root',
  database: 'fitosanitario',
});

async function run() {
  const client = await pool.connect();
  try {
    // Check if VOLVER_A_REPORTAR already exists
    const { rows } = await client.query("SELECT unnest(enum_range(NULL::estado_reporte)) AS val");
    const vals = rows.map(r => r.val);
    console.log('Current estado_reporte values:', vals);

    if (!vals.includes('VOLVER_A_REPORTAR')) {
      await client.query("ALTER TYPE estado_reporte ADD VALUE 'VOLVER_A_REPORTAR'");
      console.log('Added VOLVER_A_REPORTAR to enum');
    } else {
      console.log('VOLVER_A_REPORTAR already exists');
    }

    // Add columns if they don't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reportes' AND column_name='motivo_rechazo') THEN
          ALTER TABLE reportes ADD COLUMN motivo_rechazo text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reportes' AND column_name='audio_rechazo_url') THEN
          ALTER TABLE reportes ADD COLUMN audio_rechazo_url varchar(500);
        END IF;
      END $$;
    `);
    console.log('Columns added/verified');

    // Check and create tipo_duracion_suspension enum
    const { rows: tipoRows } = await client.query(
      "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_duracion_suspension') AS exists"
    );
    if (!tipoRows[0].exists) {
      await client.query("CREATE TYPE tipo_duracion_suspension AS ENUM('TIEMPO', 'DIAS')");
      console.log('Created tipo_duracion_suspension enum');
    } else {
      console.log('tipo_duracion_suspension already exists');
    }

    // Check and create suspensiones_usuarios table
    const { rows: tableRows } = await client.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suspensiones_usuarios') AS exists"
    );
    if (!tableRows[0].exists) {
      await client.query(`
        CREATE TABLE suspensiones_usuarios (
          id serial PRIMARY KEY NOT NULL,
          usuario_id integer NOT NULL,
          reporte_id integer NOT NULL,
          motivo text NOT NULL,
          tipo_duracion tipo_duracion_suspension NOT NULL,
          duracion integer NOT NULL,
          fecha_inicio timestamp DEFAULT now() NOT NULL,
          fecha_fin timestamp NOT NULL,
          activa boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        )
      `);
      await client.query('ALTER TABLE suspensiones_usuarios ADD CONSTRAINT suspensiones_usuarios_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id)');
      await client.query('ALTER TABLE suspensiones_usuarios ADD CONSTRAINT suspensiones_usuarios_reporte_id_fk FOREIGN KEY (reporte_id) REFERENCES reportes(id)');
      console.log('Created suspensiones_usuarios table');
    } else {
      console.log('suspensiones_usuarios table already exists');
    }

    console.log('Migration 0014 completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
