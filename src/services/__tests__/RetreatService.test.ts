import { RetreatService } from '../RetreatService';

describe('RetreatService - guessGender', () => {
  test('nombres femeninos terminados en a', () => {
    expect(RetreatService.guessGender('María Paula')).toBe('female');
    expect(RetreatService.guessGender('Camila')).toBe('female');
    expect(RetreatService.guessGender('Valentina')).toBe('female');
  });

  test('nombres masculinos terminados en consonante', () => {
    expect(RetreatService.guessGender('Juan José')).toBe('male');
    expect(RetreatService.guessGender('Carlos')).toBe('male');
    expect(RetreatService.guessGender('Pedro')).toBe('male');
  });

  test('excepciones conocidas', () => {
    expect(RetreatService.guessGender('Andrea')).toBe('male');
    expect(RetreatService.guessGender('Luca')).toBe('male');
  });

  test('string vacío retorna male', () => {
    expect(RetreatService.guessGender('')).toBe('male');
  });
});

describe('RetreatService - calculateAge', () => {
  test('retorna null para fecha undefined', () => {
    expect(RetreatService.calculateAge(undefined)).toBeNull();
  });

  test('retorna null para fecha vacía', () => {
    expect(RetreatService.calculateAge('')).toBeNull();
  });

  test('calcula edad positiva para fecha de nacimiento', () => {
    expect(RetreatService.calculateAge('2000-01-01')).toBeGreaterThan(0);
  });

  test('edad 0 para recién nacido', () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(RetreatService.calculateAge(dateStr)).toBe(0);
  });
});

describe('RetreatService - isBirthdayThisWeek', () => {
  test('retorna false para fecha undefined', () => {
    expect(RetreatService.isBirthdayThisWeek(undefined)).toBe(false);
  });

  test('retorna true para cumpleaños en 2 días', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const str = `1995-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    expect(RetreatService.isBirthdayThisWeek(str)).toBe(true);
  });

  test('retorna false para cumpleaños en 10 días', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const str = `1995-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    expect(RetreatService.isBirthdayThisWeek(str)).toBe(false);
  });

  test('retorna true para cumpleaños hoy', () => {
    const today = new Date();
    const str = `1995-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(RetreatService.isBirthdayThisWeek(str)).toBe(true);
  });
});
