import { supabase } from '@/lib/supabase';
import { OfflineOperation, getOfflineOperations, removeOfflineOperation, updateOfflineOperation, getOfflineQueueCount, addOfflineOperation } from './db';
import { StorageRepository } from '@/data/repositories/StorageRepository';
import { errorMessage } from '@/utils/errorGuards';

interface SyncResult {
  success: boolean;
  processed: number;
  errors: number;
  details: Array<{ id: string; success: boolean; error?: string }>;
}

export const syncOfflineOperations = async (): Promise<SyncResult> => {
  const queue = await getOfflineOperations();
  if (queue.length === 0) {
    return { success: true, processed: 0, errors: 0, details: [] };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, processed: 0, errors: queue.length, details: queue.map(q => ({ id: q.id, success: false, error: 'No user session' })) };
  }

  console.log(`--- Iniciando sincronización PWA (${queue.length} pendientes) ---`);
  let processed = 0;
  let errors = 0;
  const details: SyncResult['details'] = [];

  for (const op of queue) {
    try {
      let error: Error | null = null;

      if (op.method === 'INSERT' && op.data.signature_base64 && !op.data.signature_path) {
        try {
          const prefix = op.table === 'retreat_savings' ? `youth_${String(op.data.youth_id)}` : 'payment';
          const path = await StorageRepository.uploadSignature(op.data.signature_base64 as string, prefix);
          op.data.signature_path = path;
          delete op.data.signature_base64;
        } catch (storageErr) {
          console.error('Error subiendo firma durante sync:', storageErr);
          throw storageErr;
        }
      }

      if (op.method === 'INSERT') {
        const { error: dbErr } = await supabase.from(op.table).insert([op.data]);
        error = dbErr;

        if (dbErr?.code === '23505') {
          console.log(`Operación ${op.id} ya existía en servidor (Idempotencia).`);
          error = null;
        }
      } else if (op.method === 'UPDATE') {
        let query = supabase.from(op.table).update(op.data);
        if (op.filters) {
          Object.entries(op.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { error: dbErr } = await query;
        error = dbErr;
      } else if (op.method === 'DELETE') {
        let query = supabase.from(op.table).delete();
        if (op.filters) {
          Object.entries(op.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { error: dbErr } = await query;
        error = dbErr;
      } else if (op.method === 'RPC' && op.rpcName) {
        const { error: dbErr } = await supabase.rpc(op.rpcName, op.data);
        error = dbErr;
      }

      if (!error) {
        processed++;
        details.push({ id: op.id, success: true });
        console.log(`✅ Op ${op.id} sincronizada.`);
        await removeOfflineOperation(op.id);
      } else {
        throw error;
      }
    } catch (e: unknown) {
      const message = errorMessage(e);
      console.error(`❌ Fallo en op ${op.id}:`, message);
      const newRetryCount = (op.retryCount || 0) + 1;
      details.push({ id: op.id, success: false, error: message });

      if (newRetryCount >= 5) {
        console.warn(`Operación ${op.id} falló 5 veces, manteniendo en cola para revisión manual`);
      } else {
        await updateOfflineOperation(op.id, { retryCount: newRetryCount });
      }
      errors++;
    }
  }

  return { success: errors === 0, processed, errors, details };
};

export const queueOfflineOperation = async (op: Omit<OfflineOperation, 'id' | 'createdAt'>): Promise<string> => {
  return await addOfflineOperation(op);
};

export const getPendingCount = async (): Promise<number> => {
  return await getOfflineQueueCount();
};

export const setupOnlineListener = (onSync?: (syncing: boolean) => void): (() => void) => {
  const handleOnline = async () => {
    console.log('Conexión reestablecida. Iniciando sincronización...');
    if (onSync) onSync(true);
    try {
      await syncOfflineOperations();
    } finally {
      if (onSync) onSync(false);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
};

export const registerBackgroundSync = async (): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const registrationWithSync = registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      };
      await registrationWithSync.sync.register('offline-sync');
      console.log('Background Sync registrado');
    } catch (error) {
      console.warn('Background Sync no disponible:', error);
    }
  }
};