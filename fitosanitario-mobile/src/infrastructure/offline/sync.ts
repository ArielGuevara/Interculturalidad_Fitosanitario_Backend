import { createReporteMultipart } from '../data/reportes/reportesApi';
import { deletePendingReporte, listPendingReportes } from './pendingReportes';
import { getAccessToken } from '../auth/authStore';
import { apiClient } from '../http/apiClient';

const MAX_RETRIES = 3;

async function syncWithRetry(
  payload: any,
  token: string,
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await createReporteMultipart(payload, token);
      return true;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      console.warn(`[SYNC] Intento ${attempt}/${MAX_RETRIES} fallido: ${msg}`);

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  return false;
}

async function syncBulk(
  pending: { id: string; payload: any }[],
  token: string,
): Promise<Set<string>> {
  const syncedIds = new Set<string>();
  try {
    const reportes = pending.map((item) => ({
      localId: item.id,
      titulo: item.payload.titulo,
      descripcion: item.payload.descripcion,
      cultivoId: item.payload.cultivoId,
      latitud: item.payload.latitud,
      longitud: item.payload.longitud,
    }));

    const { data } = await apiClient.post<{ sincronizados: number; mapping: { localId: string; realId: number }[] }>(
      '/reportes/sync',
      { reportes },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    for (const m of data.mapping) {
      syncedIds.add(m.localId);
    }
    console.log(`[SYNC] Bulk sync: ${data.sincronizados} reportes sincronizados`);
  } catch (e: any) {
    console.warn('[SYNC] Bulk sync falló, usando sincronización individual:', e?.message);
  }
  return syncedIds;
}

export async function syncPendingReportes(): Promise<{ synced: number; failed: number }> {
  const pending = await listPendingReportes();
  let synced = 0;
  let failed = 0;

  if (pending.length === 0) {
    console.log('[SYNC] No hay pendientes para sincronizar');
    return { synced: 0, failed: 0 };
  }

  const token = getAccessToken();
  if (!token) {
    console.warn('[SYNC] No hay token, autentícate primero');
    return { synced: 0, failed: pending.length };
  }

  console.log(`[SYNC] Sincronizando ${pending.length} reporte(s)...`);

  // Step 1: Try bulk sync for faster processing
  const syncedIds = await syncBulk(pending, token);
  for (const id of syncedIds) {
    await deletePendingReporte(id);
    synced++;
  }

  // Step 2: Remaining items - try individual multipart upload
  const remaining = pending.filter((p) => !syncedIds.has(p.id));
  for (const item of remaining) {
    const ok = await syncWithRetry(item.payload, token);
    if (ok) {
      await deletePendingReporte(item.id);
      synced += 1;
      console.log(`[SYNC] Reporte ${item.id} enviado OK`);
    } else {
      failed += 1;
      console.warn(`[SYNC] Reporte ${item.id} falló después de ${MAX_RETRIES} intentos`);
    }
  }

  console.log(`[SYNC] Resultado final: ${synced} enviados, ${failed} fallidos`);
  return { synced, failed };
}
