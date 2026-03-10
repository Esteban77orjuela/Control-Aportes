import { supabase } from '../lib/supabase';
import { Beverage, BeverageSale } from '../types';
import { queueOfflineOperation } from './offlineSync';

// --- Beverages (Inventario) ---

export const getBeverages = async (): Promise<Beverage[]> => {
    try {
        const { data, error } = await supabase
            .from('beverages')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map(b => ({
            id: b.id,
            name: b.name,
            type: b.type,
            costPrice: Number(b.cost_price),
            salePrice: Number(b.sale_price),
            stock: b.stock,
            createdAt: b.created_at
        }));
    } catch (e) {
        console.error('Error obteniendo bebidas de Supabase:', e);
        return [];
    }
};

export const addBeverage = async (beverage: Omit<Beverage, 'id' | 'createdAt'>): Promise<void> => {
    try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { error } = await supabase
            .from('beverages')
            .insert([{
                name: beverage.name,
                type: beverage.type,
                cost_price: beverage.costPrice,
                sale_price: beverage.salePrice,
                stock: beverage.stock,
                user_id: userId
            }]);

        if (error) {
            if (error.message.includes('fetch') || error.message.includes('network')) {
                await queueOfflineOperation({
                    table: 'beverages',
                    method: 'INSERT',
                    data: {
                        name: beverage.name,
                        type: beverage.type,
                        cost_price: beverage.costPrice,
                        sale_price: beverage.salePrice,
                        stock: beverage.stock,
                        user_id: userId
                    }
                });
                return;
            }
            throw error;
        }
    } catch (e: any) {
        console.error('Error saving beverage to Supabase:', e);
        if (e.message?.includes('fetch') || e.message?.includes('network')) {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            await queueOfflineOperation({
                table: 'beverages',
                method: 'INSERT',
                data: {
                    name: beverage.name,
                    type: beverage.type,
                    cost_price: beverage.costPrice,
                    sale_price: beverage.salePrice,
                    stock: beverage.stock,
                    user_id: userId
                }
            });
            return;
        }
        throw e;
    }
};

export const updateBeverageStock = async (id: string, newStock: number): Promise<void> => {
    try {
        const { error } = await supabase
            .from('beverages')
            .update({ stock: newStock })
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.error('Error actualizando stock:', e);
        throw e;
    }
};

export const getBeverageById = async (id: string): Promise<Beverage | null> => {
    try {
        const { data, error } = await supabase
            .from('beverages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            costPrice: Number(data.cost_price),
            salePrice: Number(data.sale_price),
            stock: data.stock,
            createdAt: data.created_at
        };
    } catch (e) {
        console.error('Error obteniendo bebida:', e);
        return null;
    }
};

export const refillBeverageStock = async (id: string, quantityToAdd: number, newCostPrice?: number): Promise<void> => {
    try {
        const { error } = await supabase.rpc('update_beverage_stock', {
            p_id: id,
            p_quantity: quantityToAdd,
            p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null
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
                        p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null
                    }
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
                    p_new_cost_price: newCostPrice !== undefined ? newCostPrice : null
                }
            });
            return;
        }
        throw e;
    }
};

export const deleteBeverage = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('beverages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.error('Error eliminando bebida:', e);
        throw e;
    }
};

// --- Sales (Ventas) ---

export const sellBeverage = async (
    beverage: Beverage,
    quantity: number
): Promise<void> => {
    try {
        const total = quantity * beverage.salePrice;
        const userId = (await supabase.auth.getUser()).data.user?.id;

        // Intentar registrar la venta
        const { error: saleError } = await supabase
            .from('beverage_sales')
            .insert([{
                beverage_id: beverage.id,
                beverage_name: beverage.name,
                quantity: quantity,
                unit_price: beverage.salePrice,
                total: total,
                user_id: userId
            }]);

        if (saleError) {
            if (saleError.message.includes('fetch') || saleError.message.includes('network')) {
                // Encolar venta
                await queueOfflineOperation({
                    table: 'beverage_sales',
                    method: 'INSERT',
                    data: {
                        beverage_id: beverage.id,
                        beverage_name: beverage.name,
                        quantity: quantity,
                        unit_price: beverage.salePrice,
                        total: total,
                        user_id: userId
                    }
                });
                // Encolar resta de stock
                await queueOfflineOperation({
                    table: 'beverages',
                    method: 'RPC',
                    rpcName: 'update_beverage_stock',
                    data: { p_id: beverage.id, p_quantity: -quantity, p_new_cost_price: null }
                });
                return;
            }
            throw saleError;
        }

        // Si la venta funcionó, intentar descontar stock
        const { error: stockError } = await supabase.rpc('update_beverage_stock', {
            p_id: beverage.id,
            p_quantity: -quantity,
            p_new_cost_price: null
        });

        if (stockError) {
            if (stockError.message.includes('fetch') || stockError.message.includes('network')) {
                await queueOfflineOperation({
                    table: 'beverages',
                    method: 'RPC',
                    rpcName: 'update_beverage_stock',
                    data: { p_id: beverage.id, p_quantity: -quantity, p_new_cost_price: null }
                });
                return;
            }
            throw stockError;
        }

    } catch (e: any) {
        console.error('Error registrando venta:', e);
        if (e.message?.includes('fetch') || e.message?.includes('network')) {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const total = quantity * beverage.salePrice;
            await queueOfflineOperation({
                table: 'beverage_sales',
                method: 'INSERT',
                data: {
                    beverage_id: beverage.id,
                    beverage_name: beverage.name,
                    quantity: quantity,
                    unit_price: beverage.salePrice,
                    total: total,
                    user_id: userId
                }
            });
            await queueOfflineOperation({
                table: 'beverages',
                method: 'RPC',
                rpcName: 'update_beverage_stock',
                data: { p_id: beverage.id, p_quantity: -quantity, p_new_cost_price: null }
            });
            return;
        }
        throw e;
    }
};

export const getBeverageSales = async (): Promise<BeverageSale[]> => {
    try {
        const { data, error } = await supabase
            .from('beverage_sales')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            beverageId: s.beverage_id,
            beverageName: s.beverage_name,
            quantity: s.quantity,
            unitPrice: Number(s.unit_price),
            total: Number(s.total),
            date: s.date,
        }));
    } catch (e) {
        console.error('Error obteniendo ventas:', e);
        return [];
    }
};

export const resetBeverageSales = async (): Promise<void> => {
    try {
        const { error } = await supabase
            .from('beverage_sales')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;
    } catch (e) {
        console.error('Error reseteando ventas:', e);
        throw e;
    }
};

// --- Dashboard Stats ---

export const getBeverageDashboardStats = async () => {
    try {
        const [beverages, sales] = await Promise.all([getBeverages(), getBeverageSales()]);

        const totalProducts = beverages.length;
        const totalStock = beverages.reduce((sum, b) => sum + b.stock, 0);
        const inventoryValue = beverages.reduce((sum, b) => sum + (b.stock * b.costPrice), 0);
        const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
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
};
