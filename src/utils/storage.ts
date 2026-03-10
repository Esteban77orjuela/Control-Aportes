import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Person, Payment } from '../types';
import { queueOfflineOperation } from './offlineSync';

const STORAGE_KEYS = {
    PEOPLE: '@app:people',
    PAYMENTS: '@app:payments',
};

// --- Migration ---

export const migrateLocalDataToCloud = async (): Promise<{ success: boolean; migratedCount: number; message: string }> => {
    try {
        console.log('--- Iniciando migración de datos locales a la nube ---');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('No hay sesión activa para migrar.');
            return { success: false, migratedCount: 0, message: 'Inicia sesión para sincronizar tus datos.' };
        }
        const userId = session.user.id;

        const peopleJson = await AsyncStorage.getItem(STORAGE_KEYS.PEOPLE);
        const paymentsJson = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);

        const localPeople: Person[] = peopleJson ? JSON.parse(peopleJson) : [];
        const localPayments: Payment[] = paymentsJson ? JSON.parse(paymentsJson) : [];

        if (localPeople.length === 0) {
            console.log('No hay datos locales para migrar.');
            return { success: true, migratedCount: 0, message: '' };
        }

        console.log(`Encontrados ${localPeople.length} miembros y ${localPayments.length} pagos locales.`);

        // 1. Obtener personas que YA existen en la nube para evitar duplicados
        const { data: cloudPeople, error: cloudErr } = await supabase
            .from('people')
            .select('id, name, email, phone');

        if (cloudErr) {
            console.error('Error obteniendo datos de la nube:', cloudErr);
            return { success: false, migratedCount: 0, message: 'No se pudo conectar a la nube. Verifica tu conexión a internet e inténtalo de nuevo.' };
        }

        // Helper: normalizar texto (quitar acentos, espacios extra, minúsculas)
        const normalize = (text: string) => {
            return (text || '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ')  // Espacios dobles → uno solo
                .normalize('NFD')       // Separar acentos del carácter base
                .replace(/[\u0300-\u036f]/g, ''); // Quitar los acentos
        };

        // Helper: normalizar teléfono (solo dígitos, últimos 10)
        const normalizePhone = (phone: string) => {
            const digits = (phone || '').replace(/\D/g, '');
            return digits.length >= 10 ? digits.slice(-10) : digits;
        };

        const idMap: Record<string, string> = {};
        let hadErrors = false;
        let newPeopleCount = 0;
        let skippedPeopleCount = 0;

        // 2. Migrar personas (con detección INTELIGENTE de duplicados)
        for (const person of localPeople) {
            let existingPerson = null;

            // PRIORIDAD 1: Buscar por teléfono (más confiable que el nombre)
            if (person.phone && person.phone.trim()) {
                const localPhone = normalizePhone(person.phone);
                existingPerson = (cloudPeople || []).find(cp => {
                    const cloudPhone = normalizePhone(cp.phone || '');
                    return cloudPhone.length >= 7 && localPhone.length >= 7 && cloudPhone === localPhone;
                });
            }

            // PRIORIDAD 2: Si no tiene teléfono, buscar por nombre normalizado
            if (!existingPerson) {
                const localName = normalize(person.name);
                existingPerson = (cloudPeople || []).find(cp => {
                    return normalize(cp.name) === localName;
                });
            }

            if (existingPerson) {
                // Ya existe, no la duplicamos, solo mapeamos su ID
                console.log(`"${person.name}" ya existe en la nube (match: ${existingPerson.name}), omitiendo duplicado.`);
                idMap[person.id] = existingPerson.id;
                skippedPeopleCount++;
                continue;
            }

            // No existe, la insertamos
            const { data, error } = await supabase
                .from('people')
                .insert([{
                    name: person.name,
                    email: person.email,
                    phone: person.phone,
                    created_at: person.createdAt,
                    user_id: userId
                }])
                .select('id')
                .single();

            if (error) {
                console.error(`Error migrando a ${person.name}:`, error);
                hadErrors = true;
                continue;
            }

            if (data) {
                idMap[person.id] = data.id;
                newPeopleCount++;
            }
        }

        // 3. Migrar pagos (con detección de duplicados)
        // Obtener pagos existentes en la nube para no duplicar
        const { data: cloudPayments } = await supabase
            .from('payments')
            .select('person_id, amount, month, year');

        const paymentsToInsert = localPayments
            .map(p => ({
                person_id: idMap[p.personId],
                amount: p.amount,
                date: p.date,
                month: p.month,
                year: p.year,
                signature_base64: p.signatureBase64,
                created_at: p.date,
                user_id: userId
            }))
            .filter(p => p.person_id) // Solo pagos cuya persona fue mapeada
            .filter(p => {
                // Verificar que este pago no exista ya en la nube
                const isDuplicate = (cloudPayments || []).some(
                    cp => cp.person_id === p.person_id
                        && cp.amount === p.amount
                        && cp.month === p.month
                        && cp.year === p.year
                );
                if (isDuplicate) {
                    console.log(`Pago duplicado detectado (persona: ${p.person_id}, mes: ${p.month}, monto: ${p.amount}), omitiendo.`);
                }
                return !isDuplicate;
            });

        let newPaymentsCount = 0;
        if (paymentsToInsert.length > 0) {
            const { error: pError } = await supabase.from('payments').insert(paymentsToInsert);
            if (pError) {
                console.error('Error migrando pagos:', pError);
                hadErrors = true;
            } else {
                newPaymentsCount = paymentsToInsert.length;
            }
        } else if (localPayments.length > 0 && Object.keys(idMap).length === 0) {
            hadErrors = true;
        }

        // 4. Limpieza ESTRICTA (Solo borra si NO hubo NINGÚN error y se procesaron TODOS)
        const allPeopleMapped = Object.keys(idMap).length === localPeople.length;

        if (!hadErrors && allPeopleMapped) {
            await AsyncStorage.removeItem(STORAGE_KEYS.PEOPLE);
            await AsyncStorage.removeItem(STORAGE_KEYS.PAYMENTS);
            console.log('--- Migración completada con éxito al 100%. Datos locales eliminados limpiamente. ---');

            const msg = newPeopleCount > 0 || newPaymentsCount > 0
                ? `Se subieron ${newPeopleCount} miembros nuevos y ${newPaymentsCount} pagos nuevos a la nube.${skippedPeopleCount > 0 ? ` (${skippedPeopleCount} miembros ya existían y no se duplicaron)` : ''}`
                : `Todos los datos ya estaban en la nube. No se crearon duplicados.`;

            return { success: true, migratedCount: newPeopleCount, message: msg };
        } else {
            console.log('--- Migración parcial o con errores. No se borró la caché local para evitar pérdida de datos. ---');
            return {
                success: false,
                migratedCount: Object.keys(idMap).length,
                message: 'Algunos datos no se pudieron migrar. Tus datos locales siguen intactos. Intenta de nuevo con buena conexión a internet.'
            };
        }

    } catch (e) {
        console.error('Error fatal en la migración:', e);
        return { success: false, migratedCount: 0, message: 'Error de conexión. Tus datos locales siguen intactos en tu celular.' };
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
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { error } = await supabase
            .from('people')
            .insert([{
                name: person.name,
                email: person.email,
                phone: person.phone,
                user_id: userId
            }]);

        if (error) {
            // Si el error es de red, encolamos offline
            if (error.message.includes('fetch') || error.message.includes('network')) {
                await queueOfflineOperation({
                    table: 'people',
                    method: 'INSERT',
                    data: { name: person.name, email: person.email, phone: person.phone, user_id: userId }
                });
                return;
            }
            throw error;
        }
    } catch (e: any) {
        console.error('Error saving person to Supabase', e);
        // Si no capturó el error de red por el if de arriba, lo capturamos aquí
        if (e.message?.includes('fetch') || e.message?.includes('network')) {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            await queueOfflineOperation({
                table: 'people',
                method: 'INSERT',
                data: { name: person.name, email: person.email, phone: person.phone, user_id: userId }
            });
            return;
        }
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

export const getPayments = async (includeSignature: boolean = false): Promise<Payment[]> => {
    try {
        let query = supabase
            .from('payments')
            .select(includeSignature ? '*' : 'id,person_id,amount,date,month,year')
            .order('date', { ascending: false });

        const { data, error } = await query as { data: any[] | null, error: any };

        if (error) throw error;

        return (data || []).map((p: any) => ({
            id: p.id,
            personId: p.person_id,
            amount: p.amount,
            date: p.date,
            month: p.month,
            year: p.year,
            signatureBase64: p.signature_base64 || ''
        }));
    } catch (e) {
        console.error('Error reading payments from Supabase', e);
        return [];
    }
};

export const savePayment = async (payment: Payment): Promise<void> => {
    try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { error } = await supabase
            .from('payments')
            .insert([{
                person_id: payment.personId,
                amount: payment.amount,
                date: payment.date,
                month: payment.month,
                year: payment.year,
                signature_base64: payment.signatureBase64,
                user_id: userId
            }]);

        if (error) {
            if (error.message.includes('fetch') || error.message.includes('network')) {
                await queueOfflineOperation({
                    table: 'payments',
                    method: 'INSERT',
                    data: {
                        person_id: payment.personId,
                        amount: payment.amount,
                        date: payment.date,
                        month: payment.month,
                        year: payment.year,
                        signature_base64: payment.signatureBase64,
                        user_id: userId
                    }
                });
                return;
            }
            throw error;
        }
    } catch (e: any) {
        console.error('Error saving payment to Supabase', e);
        if (e.message?.includes('fetch') || e.message?.includes('network')) {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            await queueOfflineOperation({
                table: 'payments',
                method: 'INSERT',
                data: {
                    person_id: payment.personId,
                    amount: payment.amount,
                    date: payment.date,
                    month: payment.month,
                    year: payment.year,
                    signature_base64: payment.signatureBase64,
                    user_id: userId
                }
            });
            return;
        }
        throw e;
    }
};

export const getPaymentsByPerson = async (personId: string): Promise<Payment[]> => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*') // Aquí sí necesitamos la firma para el detalle
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
        const { data, error } = await supabase.rpc('get_music_dashboard_stats');

        if (error) throw error;

        return data as {
            totalMembers: number;
            totalTransactions: number;
            totalAmount: number;
            peopleStats: (Person & { totalContributed: number })[];
        };
    } catch (e) {
        console.error('Error fetching dashboard stats via RPC', e);
        return {
            totalMembers: 0,
            totalTransactions: 0,
            totalAmount: 0,
            peopleStats: [],
        };
    }
};

export const logout = async (): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (e) {
        console.error('Error al cerrar sesión:', e);
        throw e;
    }
};


