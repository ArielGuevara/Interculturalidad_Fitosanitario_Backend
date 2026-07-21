import { getDb } from '../db/db';
import type { CreateRecomendacionInput } from '../../domain/recomendaciones/types';

type PendingRecomendacion = {
  id: string;
  payload: CreateRecomendacionInput;
  createdAt: number;
};

function makeLocalId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function enqueueRecomendacion(payload: CreateRecomendacionInput): Promise<PendingRecomendacion> {
  const db = await getDb();
  const pending: PendingRecomendacion = {
    id: makeLocalId(),
    payload,
    createdAt: Date.now(),
  };
  await db.runAsync('INSERT INTO pending_recomendaciones (id, payload, createdAt) VALUES (?, ?, ?)', [
    pending.id,
    JSON.stringify(pending.payload),
    pending.createdAt,
  ]);
  return pending;
}

export async function listPendingRecomendaciones(): Promise<PendingRecomendacion[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; payload: string; createdAt: number }>(
    'SELECT id, payload, createdAt FROM pending_recomendaciones ORDER BY createdAt ASC',
  );
  return rows.map((r) => ({
    id: r.id,
    payload: JSON.parse(r.payload) as CreateRecomendacionInput,
    createdAt: r.createdAt,
  }));
}

export async function deletePendingRecomendacion(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_recomendaciones WHERE id=?', [id]);
}
