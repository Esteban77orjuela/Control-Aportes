import { supabase } from '../lib/supabase';
import { Beverage, BeverageSale } from '../types';

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
        const { error } = await supabase
            .from('beverages')
            .insert([{
                name: beverage.name,
                type: beverage.type,
                cost_price: beverage.costPrice,
                sale_price: beverage.salePrice,
                stock: beverage.stock,
            }]);

        if (error) throw error;
    } catch (e) {
        console.error('Error guardando bebida en Supabase:', e);
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
        // 1. Obtener stock actual
        const beverage = await getBeverageById(id);
        if (!beverage) throw new Error('Bebida no encontrada');

        // 2. Calcular nuevo stock
        const newStock = beverage.stock + quantityToAdd;

        // 3. Actualizar en Supabase (opcionalmente el precio de costo si cambió)
        const updateData: any = { stock: newStock };
        if (newCostPrice !== undefined) {
            updateData.cost_price = newCostPrice;
        }

        const { error } = await supabase
            .from('beverages')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.error('Error recargando stock:', e);
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

        // 1. Registrar la venta
        const { error: saleError } = await supabase
            .from('beverage_sales')
            .insert([{
                beverage_id: beverage.id,
                beverage_name: beverage.name,
                quantity: quantity,
                unit_price: beverage.salePrice,
                total: total,
            }]);

        if (saleError) throw saleError;

        // 2. Descontar del inventario
        const newStock = beverage.stock - quantity;
        await updateBeverageStock(beverage.id, newStock);

    } catch (e) {
        console.error('Error registrando venta:', e);
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
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Trick to delete all if RLS allows or just use .gt('id', 0)

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
