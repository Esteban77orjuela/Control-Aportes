export const isNetworkError = (e: unknown): boolean =>
  e instanceof Error && (e.message.includes('fetch') || e.message.includes('network'));

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);