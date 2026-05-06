import { syncOfflineOperations } from '../../../utils/offlineSync';

export const syncPendingQueue = async () => {
  return syncOfflineOperations();
};
