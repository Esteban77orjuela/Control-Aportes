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

// --- Dashboard Aggregates ---

export const getDashboardStats = async () => {
    const people = await getPeople();
    const payments = await getPayments();

    const totalMembers = people.length;
    const totalTransactions = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Sort people by total contribution
    const peopleStats = people.map(person => {
        const personPayments = payments.filter(p => p.personId === person.id);
        const totalContributed = personPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
            ...person,
            totalContributed
        };
    }).sort((a, b) => b.totalContributed - a.totalContributed);

    return {
        totalMembers,
        totalTransactions,
        totalAmount,
        peopleStats
    };
};
