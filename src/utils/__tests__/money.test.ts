import { roundMoney, parseMoneyInput } from '../money';

describe('roundMoney', () => {
  test('redondea a 2 decimales', () => {
    expect(roundMoney(10.456)).toBe(10.46);
  });

  test('mantiene valor exacto', () => {
    expect(roundMoney(10.5)).toBe(10.5);
  });

  test('maneja números enteros', () => {
    expect(roundMoney(10)).toBe(10);
  });
});

describe('parseMoneyInput', () => {
  test('parsea número simple', () => {
    expect(parseMoneyInput('15000')).toBe(15000);
  });

  test('parsea con punto decimal', () => {
    expect(parseMoneyInput('15000.50')).toBe(15000.5);
  });

  test('parsea con coma decimal', () => {
    expect(parseMoneyInput('15000,50')).toBe(15000.5);
  });

  test('parsea con separadores de miles', () => {
    expect(parseMoneyInput('10,000.50')).toBe(10000.5);
  });

  test('parsea con espacios', () => {
    expect(parseMoneyInput('10 000')).toBe(10000);
  });

  test('parsea con puntos de miles', () => {
    expect(parseMoneyInput('10.000')).toBe(10000);
  });

  test('retorna null para string vacío', () => {
    expect(parseMoneyInput('')).toBeNull();
  });

  test('retorna null para null', () => {
    expect(parseMoneyInput(null as unknown as string)).toBeNull();
  });

  test('retorna null para texto inválido', () => {
    expect(parseMoneyInput('abcdef')).toBeNull();
  });

  test('limpia caracteres no numéricos', () => {
    expect(parseMoneyInput('$ 5.000,75 COP')).toBe(5000.75);
  });

  test('parsea millones con puntos de miles', () => {
    expect(parseMoneyInput('1.234.567')).toBe(1234567);
  });

  test('parsea millones con comas de miles', () => {
    expect(parseMoneyInput('1,234,567')).toBe(1234567);
  });

  test('parsea millones exactos', () => {
    expect(parseMoneyInput('1.000.000')).toBe(1000000);
  });

  test('parsea millones con decimales', () => {
    expect(parseMoneyInput('1.234.567,89')).toBe(1234567.89);
    expect(parseMoneyInput('1,234,567.89')).toBe(1234567.89);
  });

  test('no confunde miles de 3 dígitos con decimales', () => {
    expect(parseMoneyInput('10.000')).toBe(10000);
    expect(parseMoneyInput('1.000')).toBe(1000);
    expect(parseMoneyInput('1234.567')).toBe(1234567);
  });

  test('parsea decimales de 1 dígito', () => {
    expect(parseMoneyInput('1234,5')).toBe(1234.5);
  });

  test('parsea punto decimal sin parte entera', () => {
    expect(parseMoneyInput('.50')).toBe(0.5);
  });
});
