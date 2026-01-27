import AsyncStorage from '@react-native-async-storage/async-storage';
import { Person, Payment } from '../types';

const STORAGE_KEYS = {
    PEOPLE: '@app:people',
    PAYMENTS: '@app:payments',
};

// --- People ---

export const getPeople = async (): Promise<Person[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PEOPLE);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error reading people', e);
        return [];
    }
};

export const savePerson = async (person: Person): Promise<void> => {
    try {
        const people = await getPeople();
        const updatedPeople = [...people, person];
        await AsyncStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(updatedPeople));
    } catch (e) {
        console.error('Error saving person', e);
        throw e;
    }
};

export const updatePerson = async (updatedPerson: Person): Promise<void> => {
    try {
        const people = await getPeople();
        const updatedPeople = people.map(p => p.id === updatedPerson.id ? updatedPerson : p);
        await AsyncStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(updatedPeople));
    } catch (e) {
        console.error('Error updating person', e);
        throw e;
    }
};

export const getPersonById = async (id: string): Promise<Person | undefined> => {
    const people = await getPeople();
    return people.find(p => p.id === id);
};

// --- Payments ---

export const getPayments = async (): Promise<Payment[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error reading payments', e);
        return [];
    }
};

export const savePayment = async (payment: Payment): Promise<void> => {
    try {
        const payments = await getPayments();
        const updatedPayments = [...payments, payment];
        await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
    } catch (e) {
        console.error('Error saving payment', e);
        throw e;
    }
};

export const getPaymentsByPerson = async (personId: string): Promise<Payment[]> => {
    const payments = await getPayments();
    return payments.filter(p => p.personId === personId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Deletions ---

export const deletePerson = async (id: string): Promise<void> => {
    try {
        const people = await getPeople();
        const payments = await getPayments();

        // Remove person and their payments
        const updatedPeople = people.filter(p => p.id !== id);
        const updatedPayments = payments.filter(p => p.personId !== id);

        await AsyncStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(updatedPeople));
        await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
    } catch (e) {
        console.error('Error deleting person', e);
        throw e;
    }
};

// --- Dashboard Aggregates (Optimized) ---

export const getDashboardStats = async () => {
    const [people, payments] = await Promise.all([getPeople(), getPayments()]);

    const totalMembers = people.length;
    const totalTransactions = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Efficiently calculate contributions using a Map
    const contributionsMap = payments.reduce((acc, p) => {
        acc[p.personId] = (acc[p.personId] || 0) + p.amount;
        return acc;
    }, {} as Record<string, number>);

    const peopleStats = people.map(person => ({
        ...person,
        totalContributed: contributionsMap[person.id] || 0
    })).sort((a, b) => b.totalContributed - a.totalContributed);

    return {
        totalMembers,
        totalTransactions,
        totalAmount,
        peopleStats
    };
};
