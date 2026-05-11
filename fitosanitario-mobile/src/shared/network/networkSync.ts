import NetInfo from '@react-native-community/netinfo';
import { syncPendingReportes } from '../../infrastructure/offline/sync';

let isSyncing = false;
let hasInitialized = false;
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 10_000; // 10 segundos mínimo entre syncs

let unsubscribe: (() => void) | null = null;

/**
 * Ejecuta sincronización segura (con control de duplicados y cooldown)
 */
async function runSync(source: 'network' | 'app') {
  const now = Date.now();

  // Evita sincronizaciones muy seguidas
  if (now - lastSyncTime < MIN_SYNC_INTERVAL) return;

  // Evita ejecución paralela
  if (isSyncing) return;

  isSyncing = true;
  lastSyncTime = now;

  try {
    console.log(`[SYNC] Ejecutando sync desde: ${source}`);

    const result = await syncPendingReportes();

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

  if (state.isConnected && state.isInternetReachable) {
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