import NetInfo from '@react-native-community/netinfo';
import { syncPendingReportes, syncPendingRecomendaciones } from '../../infrastructure/offline/sync';

let isSyncing = false;
let hasInitialized = false;

let unsubscribe: (() => void) | null = null;

/**
 * Ejecuta sincronización segura (con control de duplicados)
 */
async function runSync(source: 'network' | 'app') {
  // Evita ejecución paralela
  if (isSyncing) return;

  isSyncing = true;

  try {
    console.log(`[SYNC] Ejecutando sync desde: ${source}`);

    const result = await syncPendingReportes();
    await syncPendingRecomendaciones();

    console.log('[SYNC] Resultado:', result);
  } catch (err) {
    console.log('[SYNC ERROR]', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Activa sincronización automática cuando vuelve internet
 */
export function startAutoSync() {
  if (hasInitialized) return;
  hasInitialized = true;

  unsubscribe = NetInfo.addEventListener((state) => {
  console.log('[NET STATE]', {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
  });

  if (state.isConnected && state.isInternetReachable !== false) {
    runSync('network');
  }
});
}

/**
 * Sincroniza al abrir la app
 */
export async function syncOnAppStart() {
  await runSync('app');
}

/**
 * Limpia listener (buena práctica para evitar memory leaks)
 */
export function stopAutoSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  hasInitialized = false;
}