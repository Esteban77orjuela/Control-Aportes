import { supabase } from '../../lib/supabase';
import { getAuthenticatedUserOrThrow } from '../../lib/authGuard';
import { Youth, RetreatSaving } from '../../types';
import { queueOfflineOperation } from '../../utils/offlineSync';
import { roundMoney } from '../../utils/money';
import { generateUUID } from '../../utils/uuid';

export const RetreatRepository = {
  getYouths: async (): Promise<Youth[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('youths')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(y => ({
        id: y.id,
        name: y.name,
        phone: y.phone,
        targetAmount: Number(y.target_amount),
        birthDate: y.birth_date,
        milestones: y.milestones,
        gender: y.gender,
        createdAt: y.created_at,
      }));
    } catch (e) {
      console.error('Error fetching youths:', e);
      return [];
    }
  },

  saveYouth: async (youth: Omit<Youth, 'createdAt'>): Promise<void> => {
    try {
      const user = await getAuthenticatedUserOrThrow();
      const { error } = await supabase.from('youths').insert([
        {
          id: youth.id || generateUUID(), // ID generado por el cliente (Fase 6)
          name: youth.name,
          phone: youth.phone,
          target_amount: roundMoney(youth.targetAmount),
          birth_date: youth.birthDate,
          milestones: youth.milestones,
          gender: youth.gender,
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'youths',
            method: 'INSERT',
            data: {
              id: youth.id,
              name: youth.name,
              phone: youth.phone,
              target_amount: roundMoney(youth.targetAmount),
              user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error saving youth:', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        await queueOfflineOperation({
          table: 'youths',
          method: 'INSERT',
          data: {
            id: youth.id,
            name: youth.name,
            phone: youth.phone,
            target_amount: roundMoney(youth.targetAmount),
            birth_date: youth.birthDate,
            milestones: youth.milestones,
            gender: youth.gender,
            user_id: user.id,
          },
        });
        return;
      }
      throw e;
    }
  },

  updateYouth: async (youth: Youth): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('youths')
        .update({
          name: youth.name,
          phone: youth.phone,
          target_amount: youth.targetAmount,
          birth_date: youth.birthDate,
          milestones: youth.milestones,
          gender: youth.gender,
        })
        .eq('id', youth.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error updating youth:', e);
      throw e;
    }
  },

  deleteYouth: async (id: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('youths')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting youth:', e);
      throw e;
    }
  },

  getYouthById: async (id: string): Promise<Youth | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('youths')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        targetAmount: Number(data.target_amount),
        birthDate: data.birth_date,
        milestones: data.milestones,
        gender: data.gender,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Error fetching youth:', e);
      return null;
    }
  },

  saveRetreatSaving: async (saving: RetreatSaving): Promise<void> => {
    try {
      const user = await getAuthenticatedUserOrThrow();
      const normalizedAmount = roundMoney(saving.amount);
      const { error } = await supabase.from('retreat_savings').insert([
        {
          id: saving.id || generateUUID(), // Si el servicio ya generó un ID offline-safe
          youth_id: saving.youthId,
          amount: normalizedAmount,
          date: saving.date,
          signature_base64: saving.signatureBase64, // Solo si falló Storage
          signature_path: saving.signaturePath, // El camino real y correcto (Fase 5)
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'retreat_savings',
            method: 'INSERT',
            data: {
              id: saving.id,
              youth_id: saving.youthId,
              amount: normalizedAmount,
              date: saving.date,
              signature_base64: saving.signatureBase64,
              signature_path: saving.signaturePath,
              user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error saving retreat saving:', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        await queueOfflineOperation({
          table: 'retreat_savings',
          method: 'INSERT',
          data: {
            id: saving.id,
            youth_id: saving.youthId,
            amount: roundMoney(saving.amount),
            date: saving.date,
            signature_base64: saving.signatureBase64,
            signature_path: saving.signaturePath,
            user_id: user.id,
          },
        });
        return;
      }
      throw e;
    }
  },

  deleteRetreatSaving: async (id: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('retreat_savings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting saving:', e);
      throw e;
    }
  },

  getSavingsByYouthId: async (youthId: string): Promise<RetreatSaving[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('retreat_savings')
        .select('*')
        .eq('youth_id', youthId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        youthId: s.youth_id,
        amount: roundMoney(Number(s.amount)),
        date: s.date,
        signatureBase64: s.signature_base64,
        signaturePath: s.signature_path,
      }));
    } catch (e) {
      console.error('Error fetching savings:', e);
      return [];
    }
  },

  // RPC o lógica para el Dashboard (FASE 5 - Cálculo en el servidor)
  getDashboardStats: async () => {
    try {
      const user = await getAuthenticatedUserOrThrow();

      const { data, error } = await supabase.rpc('get_retreat_dashboard_stats', {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Supabase RPC devuelve la estructura JSON exacta que necesitamos
      return data;
    } catch (e) {
      console.error('Error fetching retreat dashboard stats via RPC:', e);
      // Fallback seguro en caso de error
      return {
        totalYouths: 0,
        totalTarget: 0,
        totalSavings: 0,
        youthsWithProgress: [],
      };
    }
  },
};
