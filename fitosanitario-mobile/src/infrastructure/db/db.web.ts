// Web-compatible mock for expo-sqlite
// Uses in-memory storage instead of SQLite

const kvCache = new Map<string, { value: string; updatedAt: number }>();
const pendingStore = new Map<string, { payload: string; createdAt: number }>();

const mockDb = {
  runAsync: async (sql: string, params?: any[]) => {
    if (sql.includes('INSERT INTO kv_cache') || sql.includes('UPDATE kv_cache')) {
      const [key, value, updatedAt] = params || [];
      kvCache.set(key, { value, updatedAt });
    } else if (sql.includes('DELETE FROM pending_reportes')) {
      const [id] = params || [];
      pendingStore.delete(id);
    } else if (sql.includes('INSERT INTO pending_reportes')) {
      const [id, payload, createdAt] = params || [];
      pendingStore.set(id, { payload, createdAt });
    } else if (sql.includes('PRAGMA') || sql.includes('CREATE TABLE')) {
      // no-op
    }
  },
  getFirstAsync: async (sql: string, params?: any[]) => {
    if (sql.includes('SELECT value FROM kv_cache')) {
      const [key] = params || [];
      const entry = kvCache.get(key);
      return entry ? { value: entry.value } : null;
    }
    return null;
  },
  getAllAsync: async (sql: string, _params?: any[]) => {
    if (sql.includes('SELECT id, payload, createdAt FROM pending_reportes')) {
      const rows = Array.from(pendingStore.entries()).map(([id, data]) => ({
        id,
        payload: data.payload,
        createdAt: data.createdAt,
      }));
      return rows;
    }
    return [];
  },
};

let instance: any = null;

export async function getDb() {
  if (!instance) {
    instance = mockDb;
  }
  return instance;
}
