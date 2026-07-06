import { getMonthName } from '../export';

describe('getMonthName', () => {
  test('retorna enero para mes 0', () => {
    expect(getMonthName(0)).toBe('Enero');
  });

  test('retorna diciembre para mes 11', () => {
    expect(getMonthName(11)).toBe('Diciembre');
  });

  test('retorna mes correcto para valores intermedios', () => {
    expect(getMonthName(5)).toBe('Junio');
    expect(getMonthName(8)).toBe('Septiembre');
  });

  test('retorna "Desconocido" para mes fuera de rango', () => {
    expect(getMonthName(12)).toBe('Desconocido');
    expect(getMonthName(-1)).toBe('Desconocido');
  });
});
