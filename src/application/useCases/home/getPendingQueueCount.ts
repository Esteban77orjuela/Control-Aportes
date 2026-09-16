import { getOfflineQueue } from '../../../utils/offlineSync';

export const getPendingQueueCount = async (): Promise<number> => {
  const queue = await getOfflineQueue();
  return queue.length;
};
