import { supabase } from '../../lib/supabase';
import { getAuthenticatedUserOrThrow } from '../../lib/authGuard';
import { Payment } from '../../types';
import { queueOfflineOperation } from '../../utils/offlineSync';
import { roundMoney } from '../../utils/money';
import { generateUUID } from '../../utils/uuid';

export const PaymentRepository = {
  getAll: async (includeSignature: boolean = false): Promise<Payment[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const query = supabase
        .from('payments')
        .select(includeSignature ? '*' : 'id,person_id,amount,date,month,year')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      const { data, error } = (await query) as { data: any[] | null; error: any };

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        personId: p.person_id,
        amount: roundMoney(Number(p.amount)),
        date: p.date,
        month: p.month,
        year: p.year,
        signatureBase64: p.signature_base64 || '',
        signaturePath: p.signature_path,
      }));
    } catch (e) {
      console.error('Error reading payments from Supabase', e);
      return [];
    }
  },

  save: async (payment: Omit<Payment, 'id'> & { signaturePath?: string }): Promise<void> => {
    const normalizedAmount = roundMoney(payment.amount);

    if (!payment.personId || typeof payment.personId !== 'string') {
      throw new Error('Datos de pago inválidos: falta el miembro.');
    }
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error('Datos de pago inválidos: el monto no es un número válido.');
    }
    if (!Number.isInteger(payment.month) || payment.month < 0 || payment.month > 11) {
      throw new Error('Datos de pago inválidos: el mes no es válido.');
    }
    if (!Number.isInteger(payment.year) || payment.year < 2000 || payment.year > 2100) {
      throw new Error('Datos de pago inválidos: el año no es válido.');
    }
    if (!payment.date || typeof payment.date !== 'string') {
      throw new Error('Datos de pago inválidos: falta la fecha.');
    }

    try {
      const user = await getAuthenticatedUserOrThrow();
      const { error } = await supabase.from('payments').insert([
        {
          id: generateUUID(), // Fase 6: Idempotencia
          person_id: payment.personId,
          amount: normalizedAmount,
          date: payment.date,
          month: payment.month,
          year: payment.year,
          signature_base64: payment.signatureBase64,
          signature_path: payment.signaturePath, // Fase 5: Storage
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'payments',
            method: 'INSERT',
            data: {
              id: generateUUID(),
              person_id: payment.personId,
              amount: normalizedAmount,
              date: payment.date,
              month: payment.month,
              year: payment.year,
              signature_base64: payment.signatureBase64,
              signature_path: payment.signaturePath,
              user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error saving payment to Supabase', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        await queueOfflineOperation({
          table: 'payments',
          method: 'INSERT',
          data: {
            id: generateUUID(),
            person_id: payment.personId,
            amount: normalizedAmount,
            date: payment.date,
            month: payment.month,
            year: payment.year,
            signature_base64: payment.signatureBase64,
            user_id: user.id,
          },
        });
        return;
      }
      throw e;
    }
  },

  getByPersonId: async (personId: string): Promise<Payment[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*') // Aquí sí necesitamos la firma para el detalle
        .eq('person_id', personId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        personId: p.person_id,
        amount: roundMoney(Number(p.amount)),
        date: p.date,
        month: p.month,
        year: p.year,
        signatureBase64: p.signature_base64,
        signaturePath: p.signature_path,
      }));
    } catch (e) {
      console.error('Error fetching payments by person', e);
      return [];
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.rpc('soft_delete_payment', {
        p_payment_id: id,
      });

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting payment in Supabase', e);
      throw e;
    }
  },
};
