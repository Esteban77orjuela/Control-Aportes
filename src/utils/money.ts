export const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const parseMoneyInput = (raw: string): number | null => {
  if (!raw) return null;

  const trimmed = raw.trim().replace(/\s/g, '');
  const cleaned = trimmed.replace(/[^\d.,-]/g, '');
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const hasComma = lastComma >= 0;
  const hasDot = lastDot >= 0;

  let intPart: string;
  let decPart: string;

  if (hasComma && hasDot) {
    // Separadores mixtos: el último que aparece es el decimal (convención internacional)
    const decimalSep = Math.max(lastComma, lastDot);
    intPart = cleaned.slice(0, decimalSep).replace(/[.,]/g, '');
    decPart = cleaned.slice(decimalSep + 1).replace(/[.,]/g, '');
  } else if (hasComma || hasDot) {
    const sep = hasComma ? ',' : '.';
    const occurrences = cleaned.split(sep).length - 1;
    const idx = cleaned.lastIndexOf(sep);
    const after = cleaned.slice(idx + 1);

    if (occurrences === 1 && after.length > 0 && after.length <= 2) {
      // Un solo separador con 1-2 dígitos después → decimal (15000.50 o 15000,5)
      intPart = cleaned.slice(0, idx).replace(/[.,]/g, '');
      decPart = after;
    } else {
      // Uno o varios separadores con 3+ dígitos al final → miles (estilo COP: 10.000, 1.234.567)
      intPart = cleaned.replace(/[.,]/g, '');
      decPart = '';
    }
  } else {
    intPart = cleaned;
    decPart = '';
  }

  if (!intPart && !decPart) return null;

  const numeric = decPart ? Number(`${intPart || '0'}.${decPart}`) : Number(intPart);
  if (!Number.isFinite(numeric)) return null;
  return roundMoney(numeric);
};
