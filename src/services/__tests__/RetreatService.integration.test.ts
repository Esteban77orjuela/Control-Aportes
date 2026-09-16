jest.mock('../../data/repositories/RetreatRepository');
jest.mock('../../data/repositories/AuditRepository');
jest.mock('../../data/repositories/StorageRepository');

import { RetreatService } from '../RetreatService';
import { RetreatRepository } from '../../data/repositories/RetreatRepository';
import { AuditRepository } from '../../data/repositories/AuditRepository';
import { StorageRepository } from '../../data/repositories/StorageRepository';

const mockedRetreatRepository = jest.mocked(RetreatRepository);
const mockedAuditRepository = jest.mocked(AuditRepository);
const mockedStorageRepository = jest.mocked(StorageRepository);

describe('RetreatService - registerYouth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRetreatRepository.saveYouth.mockResolvedValue(undefined);
    mockedAuditRepository.log.mockResolvedValue(undefined);
  });

  test('registra joven con datos v\u00e1lidos', async () => {
    await RetreatService.registerYouth({
      name: 'Mar\u00eda Paula',
      targetAmount: 50000,
    });
    expect(mockedRetreatRepository.saveYouth).toHaveBeenCalledTimes(1);
    expect(mockedAuditRepository.log).toHaveBeenCalledWith(
      'INSERT',
      'youths',
      expect.any(String),
      null,
      expect.any(Object)
    );
  });

  test('detecta g\u00e9nero femenino autom\u00e1ticamente', async () => {
    let savedData: any;
    mockedRetreatRepository.saveYouth.mockImplementation(async data => {
      savedData = data;
    });
    await RetreatService.registerYouth({ name: 'Camila', targetAmount: 60000 });
    expect(savedData.gender).toBe('female');
  });

  test('lanza error si el nombre es inv\u00e1lido', async () => {
    await expect(
      RetreatService.registerYouth({ name: 'A', targetAmount: 60000 })
    ).rejects.toThrow();
    expect(mockedRetreatRepository.saveYouth).not.toHaveBeenCalled();
  });

  test('lanza error si targetAmount es cero', async () => {
    await expect(RetreatService.registerYouth({ name: 'Juan', targetAmount: 0 })).rejects.toThrow();
    expect(mockedRetreatRepository.saveYouth).not.toHaveBeenCalled();
  });
});

describe('RetreatService - addSaving', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRetreatRepository.saveRetreatSaving.mockResolvedValue(undefined);
    mockedAuditRepository.log.mockResolvedValue(undefined);
    mockedStorageRepository.uploadSignature.mockResolvedValue('signatures/test/path.png');
  });

  test('registra abono con firma base64', async () => {
    await RetreatService.addSaving({
      id: 'test-id',
      youthId: 'youth-1',
      amount: 20000,
      date: new Date().toISOString(),
      signatureBase64: 'data:image/png;base64,iVBORw0KGgo=',
    });
    expect(mockedStorageRepository.uploadSignature).toHaveBeenCalledTimes(1);
    expect(mockedRetreatRepository.saveRetreatSaving).toHaveBeenCalledWith(
      expect.objectContaining({
        signaturePath: 'signatures/test/path.png',
        signatureBase64: undefined,
      })
    );
    expect(mockedAuditRepository.log).toHaveBeenCalledTimes(1);
  });

  test('lanza error si monto es cero', async () => {
    await expect(
      RetreatService.addSaving({
        id: 'test-id',
        youthId: 'youth-1',
        amount: 0,
        date: new Date().toISOString(),
      })
    ).rejects.toThrow();
    expect(mockedRetreatRepository.saveRetreatSaving).not.toHaveBeenCalled();
  });

  test('lanza error si no hay firma', async () => {
    await expect(
      RetreatService.addSaving({
        id: 'test-id',
        youthId: 'youth-1',
        amount: 30000,
        date: new Date().toISOString(),
      })
    ).rejects.toThrow('La firma es obligatoria');
    expect(mockedRetreatRepository.saveRetreatSaving).not.toHaveBeenCalled();
  });

  test('usa signaturePath si ya existe (sin storage)', async () => {
    await RetreatService.addSaving({
      id: 'test-id',
      youthId: 'youth-1',
      amount: 15000,
      date: new Date().toISOString(),
      signaturePath: 'existing/path.png',
    });
    expect(mockedStorageRepository.uploadSignature).not.toHaveBeenCalled();
    expect(mockedRetreatRepository.saveRetreatSaving).toHaveBeenCalledWith(
      expect.objectContaining({ signaturePath: 'existing/path.png' })
    );
  });
});

describe('RetreatService - updateYouth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRetreatRepository.updateYouth.mockResolvedValue(undefined);
    mockedAuditRepository.log.mockResolvedValue(undefined);
  });

  test('actualiza joven v\u00e1lido', async () => {
    const youth = {
      id: 'youth-1',
      name: 'Juan Actualizado',
      targetAmount: 80000,
      createdAt: new Date().toISOString(),
    };
    await RetreatService.updateYouth(youth);
    expect(mockedRetreatRepository.updateYouth).toHaveBeenCalledWith(youth);
    expect(mockedAuditRepository.log).toHaveBeenCalledWith(
      'UPDATE',
      'youths',
      'youth-1',
      'old_data_fetching_required',
      youth
    );
  });

  test('lanza error si datos inv\u00e1lidos', async () => {
    await expect(
      RetreatService.updateYouth({
        id: 'youth-1',
        name: 'A',
        targetAmount: 80000,
        createdAt: new Date().toISOString(),
      })
    ).rejects.toThrow();
    expect(mockedRetreatRepository.updateYouth).not.toHaveBeenCalled();
  });
});
