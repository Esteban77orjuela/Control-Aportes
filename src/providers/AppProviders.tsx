'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { migrateLocalDataToCloud } from '@/utils/storage';
import { syncOfflineOperations } from '@/pwa/sync';
import { setupNetworkListener } from '@/utils/offlineSync';
import { Alert } from 'react-native';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WebAlertProvider } from '@/components/WebAlert';
import { registerSW } from '@/pwa/registerSW';
import * as Sentry from '@sentry/react';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.2,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  const runMigration = useCallback(async () => {
    setTimeout(async () => {
      const result = await migrateLocalDataToCloud();
      if (result.success && result.message) {
        Alert.alert('✅ Datos Sincronizados', result.message);
      } else if (!result.success && result.message) {
        Alert.alert('⚠️ Migración Pendiente', result.message);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (_session) {
        runMigration();
        syncOfflineOperations();
      }
    });

    setupNetworkListener();

    return () => subscription.unsubscribe();
  }, [runMigration]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !__DEV__) {
      registerSW();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <WebAlertProvider>
            <ConnectionBanner />
            {children}
          </WebAlertProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}