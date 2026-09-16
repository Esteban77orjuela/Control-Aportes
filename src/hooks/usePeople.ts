import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PeopleRepository } from '../data/repositories/PeopleRepository';
import { Person } from '../types';

export const usePeople = () => {
  return useQuery({
    queryKey: ['people'],
    queryFn: PeopleRepository.getAll,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
};

export const usePersonById = (id: string) => {
  return useQuery({
    queryKey: ['people', id],
    queryFn: () => PeopleRepository.getById(id),
    enabled: !!id,
  });
};

export const useAddPerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (person: Omit<Person, 'id'>) => PeopleRepository.save(person as Person),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (person: Person) => PeopleRepository.update(person),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PeopleRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
