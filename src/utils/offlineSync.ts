import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

// Cada operación pendiente será un objeto con esta estructura
export interface PendingOperation {
    id: string;          // ID único para la operación
    table: string;       // Tabla en Supabase (ej. 'payments', 'people', 'beverages')
    method: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
    data: any;           // El objeto a insertar/actualizar
    filters?: { [key: string]: any }; // Para UPDATE/DELETE (ej: { id: '...' })
    rpcName?: string;    // Nombre del procedimiento almacenado (si method es RPC)
    createdAt: string;   // Fecha de creación de la operación
}

const OFFLINE_QUEUE_KEY = '@app:offline_queue';

// 1. Guardar una operación en la cola cuando falla el internet
export const queueOfflineOperation = async (op: Omit<PendingOperation, 'id' | 'createdAt'>) => {
    try {
        const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue: PendingOperation[] = queueJson ? JSON.parse(queueJson) : [];

        const newOp: PendingOperation = {
            ...op,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
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

    console.log(`--- Sincronizando ${queue.length} operaciones offline ---`);
    let processed = 0;
    let errors = 0;
    const remainingQueue: PendingOperation[] = [];

    for (const op of queue) {
        try {
            let errorOccurred = false;

            if (op.method === 'INSERT') {
                const { error } = await supabase.from(op.table).insert([op.data]);
                if (error) errorOccurred = true;
            } else if (op.method === 'UPDATE') {
                let query = supabase.from(op.table).update(op.data);
                if (op.filters) {
                    Object.entries(op.filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                const { error } = await query;
                if (error) errorOccurred = true;
            } else if (op.method === 'DELETE') {
                let query = supabase.from(op.table).delete();
                if (op.filters) {
                    Object.entries(op.filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                const { error } = await query;
                if (error) errorOccurred = true;
            } else if (op.method === 'RPC' && op.rpcName) {
                const { error } = await supabase.rpc(op.rpcName, op.data);
                if (error) errorOccurred = true;
            }

            if (!errorOccurred) {
                processed++;
            } else {
                console.error(`Error procesando op ${op.id} en ${op.table}`);
                remainingQueue.push(op); // Re-encolar si falló el servidor (no la red)
                errors++;
            }
        } catch (e) {
            console.error(`Error fatal procesando op ${op.id}:`, e);
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
