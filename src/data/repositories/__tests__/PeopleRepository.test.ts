jest.mock('../../../utils/offlineSync', () => ({
  queueOfflineOperation: jest.fn().mockResolvedValue(true),
}));

import { PeopleRepository } from '../PeopleRepository';
import { supabase } from '../../../lib/supabase';
import { queueOfflineOperation } from '../../../utils/offlineSync';

const mockedQueue = jest.mocked(queueOfflineOperation);

const insertMock = (supabase as unknown as { insert: jest.Mock }).insert;
const fromMock = (supabase as unknown as { from: jest.Mock }).from;

const UUID_PATTERN = /^[0-9a-f]{8}-/i;

const validPerson = {
  name: 'Ana',
  email: 'ana@example.com',
  createdAt: '2026-09-10T00:00:00.000Z',
};

describe('PeopleRepository.save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inserta la persona con el id generado por el cliente', async () => {
    await PeopleRepository.save({ id: '', ...validPerson });

    const row = insertMock.mock.calls[0][0][0] as { id: string };
    expect(fromMock).toHaveBeenCalledWith('people');
    expect(row.id).toMatch(UUID_PATTERN);
    expect(mockedQueue).not.toHaveBeenCalled();
  });

  test('si la red falla, encola la persona con el mismo id del insert (regresión de UUID vacío)', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'network request failed' } });

    await PeopleRepository.save({ id: '', ...validPerson });

    const row = insertMock.mock.calls[0][0][0] as { id: string };
    expect(row.id).toMatch(UUID_PATTERN);

    expect(mockedQueue).toHaveBeenCalledTimes(1);
    const op = mockedQueue.mock.calls[0][0];
    expect(op.method).toBe('INSERT');
    expect(op.table).toBe('people');
    expect(op.data.id).toBe(row.id);
    expect(op.data.user_id).toBe('test-user-id');
  });
});