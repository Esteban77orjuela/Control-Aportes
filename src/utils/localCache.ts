import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@app:cache:';
const DEFAULT_TTL = 30 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

const getKey = (key: string) => `${CACHE_PREFIX}${key}`;

export const setCache = async <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> => {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    await AsyncStorage.setItem(getKey(key), JSON.stringify(entry));
  } catch {
    // Silently fail - cache is non-critical
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(getKey(key));
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const expired = Date.now() - entry.timestamp > entry.ttl;

    if (expired) {
      AsyncStorage.removeItem(getKey(key)).catch(() => {});
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {
    // Silently fail
  }
};

export const clearCacheKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getKey(key));
  } catch {
    // Silently fail
  }
};
