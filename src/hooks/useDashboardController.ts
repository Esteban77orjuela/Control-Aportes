import { useMutation, useQuery } from '@tanstack/react-query';
import { exportDashboardExcel } from '../application/useCases/dashboard/exportDashboardExcel';
import { getDashboardStats } from '../application/useCases/dashboard/getDashboardStats';

export const useDashboardController = () => {
  const statsQuery = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  const exportMutation = useMutation({
    mutationFn: exportDashboardExcel,
  });

  return {
    stats: statsQuery.data,
    loading: statsQuery.isFetching && !statsQuery.data,
    refreshing: statsQuery.isFetching,
    reload: statsQuery.refetch,
    exporting: exportMutation.isPending,
    exportReport: exportMutation.mutateAsync,
  };
};
