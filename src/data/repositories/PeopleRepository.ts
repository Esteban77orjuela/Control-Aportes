import { supabase } from '../../lib/supabase';
import { getAuthenticatedUserOrThrow } from '../../lib/authGuard';
import { Person } from '../../types';
import { queueOfflineOperation } from '../../utils/offlineSync';
import { generateUUID } from '../../utils/uuid';

export const PeopleRepository = {
  getAll: async (): Promise<Person[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        createdAt: p.created_at,
      }));
    } catch (e) {
      console.error('Error reading people from Supabase', e);
      return [];
    }
  },

  save: async (person: Person): Promise<void> => {
    try {
      const user = await getAuthenticatedUserOrThrow();
      const { error } = await supabase.from('people').insert([
        {
          id: person.id || generateUUID(),
          name: person.name,
          email: person.email,
          phone: person.phone,
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'people',
            method: 'INSERT',
            data: {
              id: person.id || generateUUID(),
              name: person.name,
              email: person.email,
              phone: person.phone,
              user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error saving person to Supabase', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        await queueOfflineOperation({
          table: 'people',
          method: 'INSERT',
          data: { name: person.name, email: person.email, phone: person.phone, user_id: user.id },
        });
        return;
      }
      throw e;
    }
  },

  update: async (updatedPerson: Person): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('people')
        .update({
          name: updatedPerson.name,
          email: updatedPerson.email,
          phone: updatedPerson.phone,
        })
        .eq('id', updatedPerson.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error updating person in Supabase', e);
      throw e;
    }
  },

  getById: async (id: string): Promise<Person | undefined> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return undefined;

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      if (!data) return undefined;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Error fetching person by ID', e);
      return undefined;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('people')
        .update({ deleted_at: now })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Soft delete en cascada: los pagos del miembro también se ocultan
      const { error: paymentsError } = await supabase
        .from('payments')
        .update({ deleted_at: now })
        .eq('person_id', id)
        .eq('user_id', user.id);

      if (paymentsError) throw paymentsError;
    } catch (e) {
      console.error('Error deleting person in Supabase', e);
      throw e;
    }
  },
};
