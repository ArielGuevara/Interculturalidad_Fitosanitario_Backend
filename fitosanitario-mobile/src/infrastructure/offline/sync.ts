import { createReporte } from '../../data/reportes/reportesApi';
import { deletePendingReporte, listPendingReportes } from './pendingReportes';
import { getAccessToken } from '../auth/authStore';

export async function syncPendingReportes(): Promise<{ synced: number; failed: number }> {
  const pending = await listPendingReportes();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await createReporte(item.payload);
      await deletePendingReporte(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}