import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentRepository } from '../data/repositories/PaymentRepository';
import { Payment } from '../types';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => PaymentRepository.getAll(),
  });
};

export const usePaymentsByPerson = (personId: string) => {
  return useQuery({
    queryKey: ['payments', personId],
    queryFn: () => PaymentRepository.getByPersonId(personId),
    enabled: !!personId,
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: Omit<Payment, 'id'> & { signaturePath?: string }) =>
      PaymentRepository.save(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PaymentRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
