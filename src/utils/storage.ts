import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Person, Payment } from '../types';

const STORAGE_KEYS = {
    PEOPLE: '@app:people',
    PAYMENTS: '@app:payments',
};

// --- Migration ---

export const migrateLocalDataToCloud = async (): Promise<{ success: boolean; migratedCount: number }> => {
    try {
        console.log('--- Iniciando migración de datos locales a la nube ---');

        const peopleJson = await AsyncStorage.getItem(STORAGE_KEYS.PEOPLE);
        const paymentsJson = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);

        const localPeople: Person[] = peopleJson ? JSON.parse(peopleJson) : [];
        const localPayments: Payment[] = paymentsJson ? JSON.parse(paymentsJson) : [];

        if (localPeople.length === 0) {
            console.log('No hay datos locales para migrar.');
            return { success: true, migratedCount: 0 };
        }

        console.log(`Encontrados ${localPeople.length} miembros y ${localPayments.length} pagos locales.`);

        const idMap: Record<string, string> = {};
        let hadErrors = false;

        // 3. Migrar personas
        for (const person of localPeople) {
            const { data, error } = await supabase
                .from('people')
                .insert([{
                    name: person.name,
                    email: person.email,
                    phone: person.phone,
                    created_at: person.createdAt
                }])
                .select('id')
                .single();

            if (error) {
                console.error(`Error migrando a ${person.name}:`, error);
                hadErrors = true; // Marcamos que hubo al menos un error
                continue;
            }

            if (data) {
                idMap[person.id] = data.id;
            }
        }

        // 4. Migrar pagos
        const paymentsToInsert = localPayments.map(p => ({
            person_id: idMap[p.personId],
            amount: p.amount,
            date: p.date,
            month: p.month,
            year: p.year,
            signature_base64: p.signatureBase64,
            created_at: p.date
        })).filter(p => p.person_id);

        if (paymentsToInsert.length > 0) {
            const { error: pError } = await supabase.from('payments').insert(paymentsToInsert);
            if (pError) {
                console.error('Error migrando pagos:', pError);
                hadErrors = true;
            }
        } else if (localPayments.length > 0) {
            // Si había pagos locales pero no se pudo armar el insert (porque fallaron las personas)
            hadErrors = true;
        }

        // 5. Limpieza ESTRICTA (Solo borra si NO hubo NINGÚN error y se procesaron TODOS)
        const allPeopleMigrated = Object.keys(idMap).length === localPeople.length;

        if (!hadErrors && allPeopleMigrated) {
            await AsyncStorage.removeItem(STORAGE_KEYS.PEOPLE);
            await AsyncStorage.removeItem(STORAGE_KEYS.PAYMENTS);
            console.log('--- Migración completada con éxito al 100%. Datos locales eliminados limpiamente. ---');
            return { success: true, migratedCount: Object.keys(idMap).length };
        } else {
            console.log('--- Migración parcial o con errores. No se borró la caché local para evitar pérdida de datos. ---');
            return { success: false, migratedCount: Object.keys(idMap).length };
        }

    } catch (e) {
        console.error('Error fatal en la migración:', e);
        return { success: false, migratedCount: 0 };
    }
};

// --- People ---

export const getPeople = async (): Promise<Person[]> => {
    try {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // Map snake_case from DB to camelCase in App
        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            createdAt: p.created_at
        }));
    } catch (e) {
        console.error('Error reading people from Supabase', e);
        return [];
    }
};

export const savePerson = async (person: Person): Promise<void> => {
    try {
        const { error } = await supabase
            .from('people')
            .insert([{
                name: person.name,
                email: person.email,
                phone: person.phone,
                // created_at is handled by DB default
            }]);

        if (error) throw error;
    } catch (e) {
        console.error('Error saving person to Supabase', e);
        throw e;
    }
};

export const updatePerson = async (updatedPerson: Person): Promise<void> => {
    try {
        const { error } = await supabase
            .from('people')
            .update({
                name: updatedPerson.name,
                email: updatedPerson.email,
                phone: updatedPerson.phone
            })
            .eq('id', updatedPerson.id);

        if (error) throw error;
    } catch (e) {
        console.error('Error updating person in Supabase', e);
        throw e;
    }
};

export const getPersonById = async (id: string): Promise<Person | undefined> => {
    try {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return undefined;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: data.created_at
        };
    } catch (e) {
        console.error('Error fetching person by ID', e);
        return undefined;
    }
};

// --- Payments ---

export const getPayments = async (): Promise<Payment[]> => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            personId: p.person_id,
            amount: p.amount,
            date: p.date,
            month: p.month,
            year: p.year,
            signatureBase64: p.signature_base64
        }));
    } catch (e) {
        console.error('Error reading payments from Supabase', e);
        return [];
    }
};

export const savePayment = async (payment: Payment): Promise<void> => {
    try {
        const { error } = await supabase
            .from('payments')
            .insert([{
                person_id: payment.personId,
                amount: payment.amount,
                date: payment.date,
                month: payment.month,
                year: payment.year,
                signature_base64: payment.signatureBase64
            }]);

        if (error) throw error;
    } catch (e) {
        console.error('Error saving payment to Supabase', e);
        throw e;
    }
};

export const getPaymentsByPerson = async (personId: string): Promise<Payment[]> => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('person_id', personId)
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            personId: p.person_id,
            amount: p.amount,
            date: p.date,
            month: p.month,
            year: p.year,
            signatureBase64: p.signature_base64
        }));
    } catch (e) {
        console.error('Error fetching payments by person', e);
        return [];
    }
};

// --- Deletions ---

export const deletePerson = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('people')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.error('Error deleting person in Supabase', e);
        throw e;
    }
};

// --- Dashboard Aggregates ---

export const getDashboardStats = async () => {
    try {
        const [peopleList, paymentsList] = await Promise.all([getPeople(), getPayments()]);

        const totalMembers = peopleList.length;
        const totalTransactions = paymentsList.length;
        const totalAmount = paymentsList.reduce((sum, p) => sum + p.amount, 0);

        const contributionsMap = paymentsList.reduce((acc, p) => {
            acc[p.personId] = (acc[p.personId] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);

        const peopleStats = peopleList.map(person => ({
            ...person,
            totalContributed: contributionsMap[person.id] || 0
        })).sort((a, b) => b.totalContributed - a.totalContributed);

        return {
            totalMembers,
            totalTransactions,
            totalAmount,
            peopleStats
        };
    } catch (e) {
        console.error('Error calculating dashboard stats', e);
        return {
            totalMembers: 0,
            totalTransactions: 0,
            totalAmount: 0,
            peopleStats: []
        };
    }
};


