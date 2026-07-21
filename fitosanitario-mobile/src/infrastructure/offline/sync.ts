import { createReporteMultipart } from '../data/reportes/reportesApi';
import { deletePendingReporte, listPendingReportes } from './pendingReportes';
import { deletePendingRecomendacion, listPendingRecomendaciones } from './pendingRecomendaciones';
import { recomendacionesApi } from '../data/recomendaciones/recomendacionesApi';
import { getAccessToken } from '../auth/authStore';

const MAX_RETRIES = 3;
let isSyncingReports = false;

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

export async function syncPendingReportes(): Promise<{ synced: number; failed: number }> {
  if (isSyncingReports) {
    console.log('[SYNC] Ya hay una sincronización en curso, saltando...');
    return { synced: 0, failed: 0 };
  }
  isSyncingReports = true;
  const pending = await listPendingReportes();
  let synced = 0;
  let failed = 0;

  if (pending.length === 0) {
    console.log('[SYNC] No hay pendientes para sincronizar');
    isSyncingReports = false;
    return { synced: 0, failed: 0 };
  }

  const token = getAccessToken();
  if (!token) {
    console.warn('[SYNC] No hay token, autentícate primero');
    isSyncingReports = false;
    return { synced: 0, failed: pending.length };
  }

  console.log(`[SYNC] Sincronizando ${pending.length} reporte(s)...`);

  try {
    for (const item of pending) {
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
  } finally {
    isSyncingReports = false;
  }

  console.log(`[SYNC] Resultado final: ${synced} enviados, ${failed} fallidos`);
  return { synced, failed };
}

export async function syncPendingRecomendaciones(): Promise<{ synced: number; failed: number }> {
  const pending = await listPendingRecomendaciones();
  let synced = 0;
  let failed = 0;

  if (pending.length === 0) return { synced: 0, failed: 0 };

  console.log(`[SYNC] Sincronizando ${pending.length} publicación(es) del foro...`);

  for (const item of pending) {
    try {
      await recomendacionesApi.create(item.payload);
      await deletePendingRecomendacion(item.id);
      synced += 1;
      console.log(`[SYNC] Foro ${item.id} enviado OK`);
    } catch (e: any) {
      failed += 1;
      console.warn(`[SYNC] Foro ${item.id} falló: ${e?.message || e}`);
    }
  }

  console.log(`[SYNC] Foro resultado: ${synced} enviados, ${failed} fallidos`);
  return { synced, failed };
}
