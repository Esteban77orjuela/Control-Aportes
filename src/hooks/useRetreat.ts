import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RetreatRepository } from '../data/repositories/RetreatRepository';
import { RetreatService } from '../services/RetreatService';
import { Youth, RetreatSaving } from '../types';

export const useYouths = () => {
    return useQuery({
        queryKey: ['youths'],
        queryFn: RetreatRepository.getYouths,
    });
};

export const useYouthById = (id: string) => {
    return useQuery({
        queryKey: ['youths', id],
        queryFn: () => RetreatRepository.getYouthById(id),
        enabled: !!id,
    });
};

export const useAddYouth = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (youth: Omit<Youth, 'id' | 'createdAt'>) => RetreatService.registerYouth(youth),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youths'] });
            queryClient.invalidateQueries({ queryKey: ['retreatStats'] });
        },
    });
};

export const useUpdateYouth = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (youth: Youth) => RetreatService.updateYouth(youth),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['youths'] });
            queryClient.invalidateQueries({ queryKey: ['youths', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['retreatStats'] });
        },
    });
};

export const useDeleteYouth = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => RetreatRepository.deleteYouth(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youths'] });
            queryClient.invalidateQueries({ queryKey: ['retreatStats'] });
        },
    });
};

export const useAddRetreatSaving = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (saving: Omit<RetreatSaving, 'id'>) => RetreatService.addSaving(saving as RetreatSaving),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['retreatStats'] });
            queryClient.invalidateQueries({ queryKey: ['retreatSavings', variables.youthId] });
        },
    });
};

export const useDeleteRetreatSaving = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id }: { id: string, youthId: string }) => RetreatRepository.deleteRetreatSaving(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['retreatStats'] });
            queryClient.invalidateQueries({ queryKey: ['retreatSavings', variables.youthId] });
        },
    });
};

export const useRetreatSavingsByYouth = (youthId: string) => {
    return useQuery({
        queryKey: ['retreatSavings', youthId],
        queryFn: () => RetreatRepository.getSavingsByYouthId(youthId),
        enabled: !!youthId,
    });
};

export const useRetreatStats = () => {
    return useQuery({
        queryKey: ['retreatStats'],
        queryFn: RetreatRepository.getDashboardStats,
    });
};
