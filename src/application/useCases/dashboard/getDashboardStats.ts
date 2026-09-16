import { DashboardRepository } from '../../../data/repositories/DashboardRepository';

export const getDashboardStats = async () => {
  return DashboardRepository.getStats();
};
