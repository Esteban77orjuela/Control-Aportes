jest.mock('../../../utils/offlineSync', () => ({
  queueOfflineOperation: jest.fn().mockResolvedValue(true),
}));

import { PaymentRepository } from '../PaymentRepository';
import { supabase } from '../../../lib/supabase';
import { queueOfflineOperation } from '../../../utils/offlineSync';

const mockedQueue = jest.mocked(queueOfflineOperation);

const insertMock = (supabase as unknown as { insert: jest.Mock }).insert;
const fromMock = (supabase as unknown as { from: jest.Mock }).from;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validPayment = {
  personId: 'person-1',
  amount: 50000,
  date: '2026-09-10T00:00:00.000Z',
  month: 8,
  year: 2026,
  signatureBase64: 'data:image/png;base64,abc',
};

describe('PaymentRepository.save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inserta el pago con user_id y un id generado por el cliente', async () => {
    await PaymentRepository.save(validPayment);

    expect(fromMock).toHaveBeenCalledWith('payments');
    const row = insertMock.mock.calls[0][0][0] as {
      id: string;
      user_id: string;
      person_id: string;
    };
    expect(row.id).toMatch(UUID_PATTERN);
    expect(row.user_id).toBe('test-user-id');
    expect(row.person_id).toBe('person-1');
    expect(mockedQueue).not.toHaveBeenCalled();
  });

  test('si la red falla, encola la operación reutilizando el mismo id del insert', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'fetch failed' } });

    await PaymentRepository.save(validPayment);

    expect(mockedQueue).toHaveBeenCalledTimes(1);
    const op = mockedQueue.mock.calls[0][0];
    const row = insertMock.mock.calls[0][0][0] as { id: string };
    expect(op.method).toBe('INSERT');
    expect(op.table).toBe('payments');
    expect(op.data.id).toBe(row.id);
    expect(op.data.user_id).toBe('test-user-id');
  });

  test('rechaza montos inválidos sin escribir ni encolar', async () => {
    await expect(PaymentRepository.save({ ...validPayment, amount: 0 })).rejects.toThrow();
    expect(insertMock).not.toHaveBeenCalled();
    expect(mockedQueue).not.toHaveBeenCalled();
  });
});