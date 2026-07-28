import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSupabase = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const updateStatus = async () => {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        setStatus('disconnected');
        return;
      }
      const online = await checkSupabase();
      setStatus(online ? 'connected' : 'disconnected');
    };

    updateStatus();
    intervalRef.current = setInterval(updateStatus, 30000);

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        checkSupabase().then(online => {
          setStatus(online ? 'connected' : 'disconnected');
        });
      } else {
        setStatus('disconnected');
      }
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
};
