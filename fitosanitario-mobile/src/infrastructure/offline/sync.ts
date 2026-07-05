import { createReporteMultipart } from '../data/reportes/reportesApi';
import { deletePendingReporte, listPendingReportes } from './pendingReportes';
import { getAccessToken } from '../auth/authStore';

const MAX_RETRIES = 3;

async function syncWithRetry(
  payload: any,
  token: string,
  retriesLeft: number = MAX_RETRIES,
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await createReporteMultipart(payload, token);
      return true;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      console.warn(`[SYNC] Intento ${attempt}/${MAX_RETRIES} fallido: ${msg}`);

      if (attempt < MAX_RETRIES) {
        // Espera exponencial: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  return false;
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

  console.log(`[SYNC] Resultado final: ${synced} enviados, ${failed} fallidos`);
  return { synced, failed };
}
