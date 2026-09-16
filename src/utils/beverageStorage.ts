import { BeverageRepository, BeverageSalesRepository } from '../data/repositories/BeverageRepository';

// --- Beverages (Inventario) ---
export const getBeverages = BeverageRepository.getAll;
export const addBeverage = BeverageRepository.add;
export const updateBeverageStock = BeverageRepository.updateStock;
export const getBeverageById = BeverageRepository.getById;
export const refillBeverageStock = BeverageRepository.refillStock;
export const deleteBeverage = BeverageRepository.delete;

// --- Sales (Ventas) ---
export const sellBeverage = BeverageSalesRepository.sell;
export const getBeverageSales = BeverageSalesRepository.getAll;
export const resetBeverageSales = BeverageSalesRepository.resetAll;

// --- Dashboard Stats ---
export const getBeverageDashboardStats = BeverageSalesRepository.getDashboardStats;
