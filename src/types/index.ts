export interface Person {
    id: string;
    name: string;
    email: string;
    phone?: string; // WhatsApp number
    createdAt: string;
}

export interface Payment {
    id: string;
    personId: string;
    amount: number;
    date: string; // ISO date string
    month: number; // 1-12 or 0-11 (Normalize to 1-12 for display, save as is. Let's use 0-11 for JS Date consistency or 1-12. User said "Grid of 12 months". Let's use 0-11)
    year: number;
    signatureBase64: string;
}

export type RootStackParamList = {
    Dashboard: undefined;
    RegisterPerson: undefined;
    NewPayment: undefined;
    MemberDetails: { personId: string };
    EditMember: { personId: string };
};
