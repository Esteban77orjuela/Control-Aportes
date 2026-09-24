jest.mock('../../data/repositories/StorageRepository', () => ({
  StorageRepository: { uploadSignature: jest.fn() },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { syncOfflineOperations } from '../offlineSync';
import { StorageRepository } from '../../data/repositories/StorageRepository';

const OFFLINE_QUEUE_KEY = '@app:offline_queue';
const mockedUpload = jest.mocked(StorageRepository.uploadSignature);

const insertMock = (supabase as unknown as { insert: jest.Mock }).insert;

const baseOp = {
  id: 'op-1',
  table: 'payments',
  method: 'INSERT' as const,
  data: {
    id: 'pay-1',
    person_id: 'p-1',
    amount: 50000,
    date: '2026-09-10T00:00:00.000Z',
    month: 8,
    year: 2026,
    user_id: 'u-1',
  },
  createdAt: '2026-09-10T10:00:00.000Z',
};

describe('offlineSync - syncOfflineOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('un insert con error 23505 se considera sincronizado y se quita de la cola', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([baseOp]));
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key value violates unique constraint' } });

    const result = await syncOfflineOperations();

    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(OFFLINE_QUEUE_KEY, '[]');
  });

  test('sube la firma a Storage antes de insertar y limpia el base64', async () => {
    const opWithSignature = {
      ...baseOp,
      table: 'retreat_savings',
      data: {
        ...baseOp.data,
        youth_id: 'y-1',
        signature_base64: 'data:image/png;base64,iVBOR',
      },
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([opWithSignature]));
    mockedUpload.mockResolvedValue('signatures/youth_y-1/firma.png');
    insertMock.mockResolvedValue({ error: null });

    const result = await syncOfflineOperations();

    expect(mockedUpload).toHaveBeenCalledWith('data:image/png;base64,iVBOR', 'youth_y-1');
    const row = insertMock.mock.calls[0][0][0] as {
      signature_path?: string;
      signature_base64?: string;
    };
    expect(row.signature_path).toBe('signatures/youth_y-1/firma.png');
    expect(row.signature_base64).toBeUndefined();
    expect(result.processed).toBe(1);
  });

  test('mantiene la operación en la cola cuando el servidor devuelve error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([baseOp]));
    insertMock.mockResolvedValue({ error: { message: 'permission denied' } });

    const result = await syncOfflineOperations();

    expect(result.success).toBe(false);
    expect(result.errors).toBe(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      OFFLINE_QUEUE_KEY,
      JSON.stringify([{ ...baseOp, retryCount: 1 }])
    );
  });
});