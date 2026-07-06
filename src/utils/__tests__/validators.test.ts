import { YouthValidator, SavingValidator } from '../validators';

describe('YouthValidator', () => {
  test('valida nombre correcto', () => {
    const result = YouthValidator.validate({ name: 'María Paula', targetAmount: 50000 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('rechaza nombre muy corto', () => {
    const result = YouthValidator.validate({ name: 'A', targetAmount: 50000 });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  test('rechaza meta de ahorro cero o negativa', () => {
    const result = YouthValidator.validate({ name: 'Juan', targetAmount: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.targetAmount).toBeDefined();
  });

  test('rechaza teléfono inválido', () => {
    const result = YouthValidator.validate({ name: 'Juan', targetAmount: 50000, phone: 'abc' });
    expect(result.isValid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  test('rechaza fecha de nacimiento futura', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = YouthValidator.validate({
      name: 'Juan',
      targetAmount: 50000,
      birthDate: future.toISOString(),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.birthDate).toBeDefined();
  });

  test('acepta teléfono válido con espacios', () => {
    const result = YouthValidator.validate({
      name: 'María',
      targetAmount: 100000,
      phone: '300 123 4567',
    });
    expect(result.isValid).toBe(true);
  });
});

describe('SavingValidator', () => {
  test('valida monto positivo', () => {
    const result = SavingValidator.validate(50000);
    expect(result.isValid).toBe(true);
  });

  test('rechaza monto cero', () => {
    const result = SavingValidator.validate(0);
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rechaza monto negativo', () => {
    const result = SavingValidator.validate(-100);
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rechaza monto que excede límite', () => {
    const result = SavingValidator.validate(6000000);
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('acepta monto en el límite', () => {
    const result = SavingValidator.validate(5000000);
    expect(result.isValid).toBe(true);
  });
});
