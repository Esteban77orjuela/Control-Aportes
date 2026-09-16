import { generateUUID } from '../uuid';

describe('generateUUID', () => {
  test('genera un string no vacío', () => {
    const id = generateUUID();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  test('genera UUID con formato correcto', () => {
    const id = generateUUID();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('genera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(ids.size).toBe(100);
  });
});
