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
  signaturePath?: string;
}

// --- Beverages (Bebidas) ---

export interface Beverage {
  id: string;
  name: string;
  type: 'agua' | 'gaseosa';
  costPrice: number; // Precio de compra/costo
  salePrice: number; // Precio de venta al público
  stock: number; // Cantidad disponible
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

// --- Retiro 2026 ---
export interface Youth {
  id: string;
  name: string;
  phone?: string;
  targetAmount: number;
  birthDate?: string; // Nuevo
  milestones?: string; // Nuevo
  gender?: 'male' | 'female' | 'other'; // Nuevo
  createdAt: string;
}

export interface RetreatSaving {
  id: string;
  youthId: string;
  amount: number;
  date: string;
  signatureBase64?: string; // Mantenido por retrocompatibilidad temporal UI
  signaturePath?: string; // Nuevo: Ruta real en Storage
}

export type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;
  PendingMembers: undefined;
  RegisterPerson: undefined;
  NewPayment:
    | { personId?: string; month?: number; year?: number; editPaymentId?: string }
    | undefined;
  MemberDetails: { personId: string };
  EditMember: { personId: string };
  BeverageDashboard: undefined;
  AddBeverage: undefined;
  SellBeverage: { beverageId: string };
  RefillStock: { beverageId?: string };
  // Módulo Retiro
  RetreatDashboard: undefined;
  RegisterYouth: undefined;
  NewRetreatSaving: { preselectedYouthId?: string } | undefined;
  YouthDetails: { youthId: string };
  EditYouth: { youthId: string };
};
