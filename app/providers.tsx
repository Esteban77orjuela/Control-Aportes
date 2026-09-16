'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { migrateLocalDataToCloud } from '@/utils/storage';
import { syncOfflineOperations } from '@/pwa/sync';
import { setupNetworkListener } from '@/utils/offlineSync';
import { Alert } from 'react-native';
import { ConnectionBanner } from '@/components/ConnectionBanner';
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

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const runMigration = async () => {
    setTimeout(async () => {
      const result = await migrateLocalDataToCloud();
      if (result.success && result.message) {
        Alert.alert("✅ Datos Sincronizados", result.message);
      } else if (!result.success && result.message) {
        Alert.alert("⚠️ Migración Pendiente", result.message);
      }
    }, 1000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        runMigration();
        syncOfflineOperations();
      }
    });

    setupNetworkListener();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !__DEV__) {
      registerSW();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <WebAlertProvider>
          <ConnectionBanner />
          {children}
        </WebAlertProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}