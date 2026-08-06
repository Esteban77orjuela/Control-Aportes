import { supabase } from '../../lib/supabase';
import { getAuthenticatedUserOrThrow } from '../../lib/authGuard';
import { Beverage, BeverageSale } from '../../types';
import { queueOfflineOperation } from '../../utils/offlineSync';
import { roundMoney } from '../../utils/money';
import { generateUUID } from '../../utils/uuid';

export const BeverageRepository = {
  getAll: async (): Promise<Beverage[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('beverages')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(b => ({
        id: b.id,
        name: b.name,
        type: b.type,
        costPrice: roundMoney(Number(b.cost_price)),
        salePrice: roundMoney(Number(b.sale_price)),
        stock: b.stock,
        createdAt: b.created_at,
      }));
    } catch (e) {
      console.error('Error obteniendo bebidas de Supabase:', e);
      return [];
    }
  },

  add: async (beverage: Omit<Beverage, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const user = await getAuthenticatedUserOrThrow();
      const normalizedCost = roundMoney(beverage.costPrice);
      const normalizedSale = roundMoney(beverage.salePrice);
      const { error } = await supabase.from('beverages').insert([
        {
          name: beverage.name,
          type: beverage.type,
          cost_price: normalizedCost,
          sale_price: normalizedSale,
          stock: beverage.stock,
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'beverages',
            method: 'INSERT',
            data: {
              name: beverage.name,
              type: beverage.type,
              cost_price: normalizedCost,
              sale_price: normalizedSale,
              stock: beverage.stock,
              user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error saving beverage to Supabase:', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        await queueOfflineOperation({
          table: 'beverages',
          method: 'INSERT',
          data: {
            name: beverage.name,
            type: beverage.type,
            cost_price: roundMoney(beverage.costPrice),
            sale_price: roundMoney(beverage.salePrice),
            stock: beverage.stock,
            user_id: user.id,
          },
        });
        return;
      }
      throw e;
    }
  },

  updateStock: async (id: string, newStock: number): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('beverages')
        .update({ stock: newStock })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error actualizando stock:', e);
      throw e;
    }
  },

  getById: async (id: string): Promise<Beverage | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('beverages')
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
        type: data.type,
        costPrice: roundMoney(Number(data.cost_price)),
        salePrice: roundMoney(Number(data.sale_price)),
        stock: data.stock,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Error obteniendo bebida:', e);
      return null;
    }
  },

  refillStock: async (id: string, quantityToAdd: number, newCostPrice?: number): Promise<void> => {
    try {
      const { error } = await supabase.rpc('update_beverage_stock', {
        p_id: id,
        p_quantity: quantityToAdd,
        p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null,
      });

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'beverages',
            method: 'RPC',
            rpcName: 'update_beverage_stock',
            data: {
              p_id: id,
              p_quantity: quantityToAdd,
              p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error recargando stock:', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        await queueOfflineOperation({
          table: 'beverages',
          method: 'RPC',
          rpcName: 'update_beverage_stock',
          data: {
            p_id: id,
            p_quantity: quantityToAdd,
            p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null,
          },
        });
        return;
      }
      throw e;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.rpc('soft_delete_beverage', {
        p_beverage_id: id,
      });

      if (error) throw error;
    } catch (e) {
      console.error('Error eliminando bebida:', e);
      throw e;
    }
  },
};

export const BeverageSalesRepository = {
  sell: async (beverage: Beverage, quantity: number): Promise<void> => {
    const unitPrice = roundMoney(beverage.salePrice);
    const saleId = generateUUID();
    const rpcParams = {
      p_sale_id: saleId,
      p_beverage_id: beverage.id,
      p_beverage_name: beverage.name,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    };

    try {
      const user = await getAuthenticatedUserOrThrow();
      const { error } = await supabase.rpc('sell_beverage', {
        ...rpcParams,
        p_user_id: user.id,
      });

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await queueOfflineOperation({
            table: 'beverage_sales',
            method: 'RPC',
            rpcName: 'sell_beverage',
            data: {
              ...rpcParams,
              p_user_id: user.id,
            },
          });
          return;
        }
        throw error;
      }
    } catch (e: any) {
      console.error('Error registrando venta:', e);
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        const user = await getAuthenticatedUserOrThrow();
        // Reintento idempotente: mismo p_sale_id, el servidor no descontará stock dos veces
        await queueOfflineOperation({
          table: 'beverage_sales',
          method: 'RPC',
          rpcName: 'sell_beverage',
          data: {
            ...rpcParams,
            p_user_id: user.id,
          },
        });
        return;
      }
      throw e;
    }
  },

  getAll: async (): Promise<BeverageSale[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('beverage_sales')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        beverageId: s.beverage_id,
        beverageName: s.beverage_name,
        quantity: s.quantity,
        unitPrice: roundMoney(Number(s.unit_price)),
        total: roundMoney(Number(s.total)),
        date: s.date,
      }));
    } catch (e) {
      console.error('Error obteniendo ventas:', e);
      return [];
    }
  },

  resetAll: async (): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('beverage_sales')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
    } catch (e) {
      console.error('Error reseteando ventas:', e);
      throw e;
    }
  },

  getDashboardStats: async () => {
    try {
      const [beverages, sales] = await Promise.all([
        BeverageRepository.getAll(),
        BeverageSalesRepository.getAll(),
      ]);

      const totalProducts = beverages.length;
      const totalStock = beverages.reduce((sum, b) => sum + b.stock, 0);
      const inventoryValue = beverages.reduce(
        (sum, b) => roundMoney(sum + b.stock * b.costPrice),
        0
      );
      const totalSalesRevenue = sales.reduce((sum, s) => roundMoney(sum + s.total), 0);
      const totalUnitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

      return {
        totalProducts,
        totalStock,
        inventoryValue,
        totalSalesRevenue,
        totalUnitsSold,
        beverages,
        sales,
      };
    } catch (e) {
      console.error('Error calculando stats de bebidas:', e);
      return {
        totalProducts: 0,
        totalStock: 0,
        inventoryValue: 0,
        totalSalesRevenue: 0,
        totalUnitsSold: 0,
        beverages: [],
        sales: [],
      };
    }
  },
};
