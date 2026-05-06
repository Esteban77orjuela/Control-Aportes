import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { StorageRepository } from '../data/repositories/StorageRepository';
import { generateUUID } from './uuid';

// Cada operación pendiente será un objeto con esta estructura
export interface PendingOperation {
    id: string;          // ID único para la operación
    table: string;       // Tabla en Supabase
    method: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
    data: any;           // El objeto a insertar/actualizar
    filters?: { [key: string]: any }; // Para UPDATE/DELETE
    rpcName?: string;    // Nombre del procedimiento almacenado
    createdAt: string;   // Fecha de creación
    retryCount?: number; // Cuántas veces ha fallado
}

const OFFLINE_QUEUE_KEY = '@app:offline_queue';

// 1. Guardar una operación en la cola cuando falla el internet
export const queueOfflineOperation = async (op: Omit<PendingOperation, 'id' | 'createdAt'>) => {
    try {
        const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue: PendingOperation[] = queueJson ? JSON.parse(queueJson) : [];

        const newOp: PendingOperation = {
            ...op,
            id: generateUUID(),
            createdAt: new Date().toISOString(),
        };

        queue.push(newOp);
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        console.log(`Operación encolada para ${op.table} (${op.method})`);
        return true;
    } catch (e) {
        console.error('Error al encolar operación offline:', e);
        return false;
    }
};

// 2. Obtener la cola actual de operaciones pendientes
export const getOfflineQueue = async (): Promise<PendingOperation[]> => {
    try {
        const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    } catch (e) {
        return [];
    }
};

// 3. Procesar las operaciones pendientes una por una
export const syncOfflineOperations = async (): Promise<{ success: boolean; processed: number; errors: number }> => {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return { success: true, processed: 0, errors: 0 };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, processed: 0, errors: queue.length };

    console.log(`--- Iniciando sincronización robusta (${queue.length} pendientes) ---`);
    let processed = 0;
    let errors = 0;
    const remainingQueue: PendingOperation[] = [];

    for (const op of queue) {
        try {
            let error = null;

            // FASE 5 & 6: Manejo de Storage en Sincronización
            // Si la operación tiene una firma base64 (porque se hizo offline),
            // primero debemos subirla a Storage antes de insertar en la DB.
            if (op.data.signature_base64 && !op.data.signature_path) {
                try {
                    const prefix = op.table === 'retreat_savings' ? `youth_${op.data.youth_id}` : 'payment';
                    const path = await StorageRepository.uploadSignature(op.data.signature_base64, prefix);
                    op.data.signature_path = path;
                    delete op.data.signature_base64; // Limpiar para que la DB no reciba el texto pesado
                } catch (storageErr) {
                    console.error('Error subiendo firma durante sync:', storageErr);
                    // Si falla el storage, reintentamos la operación completa luego
                    throw storageErr;
                }
            }

            if (op.method === 'INSERT') {
                const { error: dbErr } = await supabase.from(op.table).insert([op.data]);
                error = dbErr;
                
                // IDEMPOTENCIA: Si el error es "duplicate key", significa que ya se insertó
                // en un intento previo que falló al recibir la respuesta. Lo tratamos como éxito.
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
                console.log(`✅ Op ${op.id} sincronizada.`);
            } else {
                throw error;
            }
        } catch (e: any) {
            console.error(`❌ Fallo en op ${op.id}:`, e.message || e);
            op.retryCount = (op.retryCount || 0) + 1;
            
            // Si ha fallado demasiadas veces por errores de lógica (no de red),
            // podríamos marcarla como fallida definitiva, pero por ahora reintentamos.
            remainingQueue.push(op);
            errors++;
        }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    return { success: errors === 0, processed, errors };
};

// 4. Escuchar cambios de red para disparar la sincronización automáticamente
export const setupNetworkListener = (onsyncStatusChange?: (syncing: boolean) => void) => {
    NetInfo.addEventListener(state => {
        if (state.isConnected && state.isInternetReachable) {
            console.log('Conexión reestablecida. Iniciando sincronización...');
            if (onsyncStatusChange) onsyncStatusChange(true);
            syncOfflineOperations().finally(() => {
                if (onsyncStatusChange) onsyncStatusChange(false);
            });
        }
    });
};
