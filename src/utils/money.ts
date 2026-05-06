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
  const decimalSep = Math.max(lastComma, lastDot);

  let normalized = cleaned;
  if (decimalSep >= 0) {
    const intPart = cleaned.slice(0, decimalSep).replace(/[.,]/g, '');
    const decPart = cleaned.slice(decimalSep + 1).replace(/[.,]/g, '');
    // If separator looks like thousands group, keep integer only.
    normalized = decPart.length === 3 ? intPart + decPart : `${intPart}.${decPart}`;
  } else {
    normalized = cleaned.replace(/[.,]/g, '');
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  return roundMoney(numeric);
};
