import { getDb } from '../db/db';

export async function setCache<T>(key: string, value: T) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO kv_cache (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt',
    [key, JSON.stringify(value), Date.now()],
  );
}

export async function getCache<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv_cache WHERE key=?', [
    key,
  ]);
  if (!row) return null;
  return JSON.parse(row.value) as T;
}
