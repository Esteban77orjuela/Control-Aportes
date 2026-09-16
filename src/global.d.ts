// Type declarations for PWA APIs

interface ServiceWorkerRegistration {
  sync: SyncManager;
}

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface Window {
  __DEV__: boolean;
}

declare module 'expo-router' {
  export { useRouter } from 'expo-router';
  export { usePathname, useSegments, useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
}