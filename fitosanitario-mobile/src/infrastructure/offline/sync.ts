import { createReporteMultipart } from '../../data/reportes/reportesApi';
import { deletePendingReporte, listPendingReportes } from './pendingReportes';
import { getAccessToken } from '../auth/authStore';

export async function syncPendingReportes(): Promise<{ synced: number; failed: number }> {
  const pending = await listPendingReportes();
  let synced = 0;
  let failed = 0;

  const token = getAccessToken();
  if (!token) {
    // Not authenticated: cannot sync to API.
    return { synced: 0, failed: pending.length };
  }

  for (const item of pending) {
    try {
      await createReporteMultipart(item.payload, token);
      await deletePendingReporte(item.id);
      synced += 1;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      console.warn(`[syncPendingReportes] failed id=${item.id}: ${msg}`);
      failed += 1;
    }
  }

  return { synced, failed };
}
