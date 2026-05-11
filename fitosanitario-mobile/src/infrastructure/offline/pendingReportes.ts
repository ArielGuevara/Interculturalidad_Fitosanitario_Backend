import { getDb } from '../db/db';
import type { PendingReporte, CreateReporteInput } from '../../domain/reportes/types';

function makeLocalId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}_${Math.random().toString(16).slice(2)}`;
}

export async function enqueueReporte(payload: CreateReporteInput): Promise<PendingReporte> {
  const db = await getDb();
  const pending: PendingReporte = {
    id: makeLocalId(),
    payload,
    createdAt: Date.now(),
  };
  await db.runAsync('INSERT INTO pending_reportes (id, payload, createdAt) VALUES (?, ?, ?)', [
    pending.id,
    JSON.stringify(pending.payload),
    pending.createdAt,
  ]);
  return pending;
}

export async function listPendingReportes(): Promise<PendingReporte[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; payload: string; createdAt: number }>(
    'SELECT id, payload, createdAt FROM pending_reportes ORDER BY createdAt ASC',
  );
  return rows.map((r) => ({
    id: r.id,
    payload: JSON.parse(r.payload) as CreateReporteInput,
    createdAt: r.createdAt,
  }));
}

export async function deletePendingReporte(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_reportes WHERE id=?', [id]);
}
