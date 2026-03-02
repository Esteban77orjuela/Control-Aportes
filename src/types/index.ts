export interface Person {
    id: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: string;
}

export interface Payment {
    id: string;
    personId: string;
    amount: number;
    date: string;
    month: number;
    year: number;
    signatureBase64: string;
}

// --- Beverages (Bebidas) ---

export interface Beverage {
    id: string;
    name: string;
    type: 'agua' | 'gaseosa';
    costPrice: number;   // Precio de compra/costo
    salePrice: number;   // Precio de venta al público
    stock: number;       // Cantidad disponible
    createdAt: string;
}

export interface BeverageSale {
    id: string;
    beverageId: string;
    beverageName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    date: string;
}

export type RootStackParamList = {
    Home: undefined;
    Dashboard: undefined;
    RegisterPerson: undefined;
    NewPayment: undefined;
    MemberDetails: { personId: string };
    EditMember: { personId: string };
    BeverageDashboard: undefined;
    AddBeverage: undefined;
    SellBeverage: { beverageId: string };
    RefillStock: { beverageId?: string };
};
