import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AuthRepository } from '../data/repositories/AuthRepository';
import { getCurrentUserEmail } from '../application/useCases/home/getCurrentUserEmail';
import { getPendingQueueCount } from '../application/useCases/home/getPendingQueueCount';
import { syncPendingQueue } from '../application/useCases/home/syncPendingQueue';

export const useHomeController = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingQueueCount();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    const result = await syncPendingQueue();
    setSyncing(false);
    await refreshPendingCount();
    return result;
  }, [refreshPendingCount]);

  const logout = useCallback(async () => {
    await AuthRepository.logout();
  }, []);

  useEffect(() => {
    getCurrentUserEmail().then(setUserEmail);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPendingCount();
    }, [refreshPendingCount])
  );

  return {
    userEmail,
    pendingCount,
    syncing,
    syncNow,
    logout,
  };
};
