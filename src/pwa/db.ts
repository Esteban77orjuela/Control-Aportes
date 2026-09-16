import Dexie, { Table } from 'dexie';
import { Person, Payment, Beverage, BeverageSale, Youth, RetreatSaving } from '@/types';

export interface OfflineOperation {
  id: string;
  table: string;
  method: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
  data: any;
  filters?: Record<string, any>;
  rpcName?: string;
  createdAt: string;
  retryCount?: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  version: number;
}

export class PWADatabase extends Dexie {
  people!: Table<Person>;
  payments!: Table<Payment>;
  beverages!: Table<Beverage>;
  beverageSales!: Table<BeverageSale>;
  youths!: Table<Youth>;
  retreatSavings!: Table<RetreatSaving>;
  offlineQueue!: Table<OfflineOperation>;
  cache!: Table<CachedData>;

  constructor() {
    super('ControlAportesDB');
    this.version(1).stores({
      people: 'id, name, email, phone, createdAt',
      payments: 'id, personId, amount, date, month, year, signatureBase64, signaturePath',
      beverages: 'id, name, type, costPrice, salePrice, stock, createdAt',
      beverageSales: 'id, beverageId, beverageName, quantity, unitPrice, total, date',
      youths: 'id, name, phone, targetAmount, birthDate, milestones, gender, createdAt',
      retreatSavings: 'id, youthId, amount, date, signatureBase64, signaturePath',
      offlineQueue: 'id, table, method, createdAt',
      cache: 'key, timestamp, version',
    });
  }
}

export const db = new PWADatabase();

export const initDB = async (): Promise<void> => {
  try {
    await db.open();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  await db.transaction('rw', [db.people, db.payments, db.beverages, db.beverageSales, db.youths, db.retreatSavings], async () => {
    await db.people.clear();
    await db.payments.clear();
    await db.beverages.clear();
    await db.beverageSales.clear();
    await db.youths.clear();
    await db.retreatSavings.clear();
  });
};

export const getOfflineQueueCount = async (): Promise<number> => {
  return await db.offlineQueue.count();
};

export const addOfflineOperation = async (op: Omit<OfflineOperation, 'id' | 'createdAt'>): Promise<string> => {
  const id = crypto.randomUUID();
  const operation: OfflineOperation = {
    ...op,
    id,
    createdAt: new Date().toISOString(),
  };
  await db.offlineQueue.add(operation);
  return id;
};

export const getOfflineOperations = async (): Promise<OfflineOperation[]> => {
  return await db.offlineQueue.orderBy('createdAt').toArray();
};

export const removeOfflineOperation = async (id: string): Promise<void> => {
  await db.offlineQueue.delete(id);
};

export const updateOfflineOperation = async (id: string, updates: Partial<OfflineOperation>): Promise<void> => {
  await db.offlineQueue.update(id, updates);
};

export const clearOfflineQueue = async (): Promise<void> => {
  await db.offlineQueue.clear();
};

export const setCache = async (key: string, data: any, version = 1): Promise<void> => {
  await db.cache.put({ key, data, timestamp: Date.now(), version });
};

export const getCache = async (key: string): Promise<any | null> => {
  const entry = await db.cache.get(key);
  return entry?.data ?? null;
};

export const removeCache = async (key: string): Promise<void> => {
  await db.cache.delete(key);
};

export const clearCache = async (): Promise<void> => {
  await db.cache.clear();
};