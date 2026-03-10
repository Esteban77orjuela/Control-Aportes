import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { savePerson, getPeople } from '../utils/storage';
import { theme } from '../styles/theme';
import { Person } from '../types';

export default function RegisterPerson() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Normalizar texto para comparación flexible
    const normalize = (text: string) => {
        return (text || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const normalizePhone = (ph: string) => {
        const digits = (ph || '').replace(/\D/g, '');
        return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Por favor ingresa un nombre.');
            return;
        }

        setLoading(true);
        try {
            // Verificar duplicados contra la nube ANTES de guardar
            const existingPeople = await getPeople();

            // Verificar por teléfono (prioridad)
            if (phone.trim()) {
                const newPhone = normalizePhone(phone);
                const phoneMatch = existingPeople.find(p => {
                    const existingPhone = normalizePhone(p.phone || '');
                    return existingPhone.length >= 7 && newPhone.length >= 7 && existingPhone === newPhone;
                });
                if (phoneMatch) {
                    Alert.alert(
                        '⚠️ Miembro Duplicado',
                        `Ya existe un miembro con ese número de celular: "${phoneMatch.name}". ¿Deseas ir al Dashboard para verlo?`,
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Ir al Dashboard', onPress: () => navigation.goBack() }
                        ]
                    );
                    setLoading(false);
                    return;
                }
            }

            // Verificar por nombre (secundario)
            const normalizedName = normalize(name);
            const nameMatch = existingPeople.find(p => normalize(p.name) === normalizedName);
            if (nameMatch) {
                Alert.alert(
                    '⚠️ Nombre Similar Encontrado',
                    `Ya existe un miembro con nombre similar: "${nameMatch.name}" (Tel: ${nameMatch.phone || 'sin teléfono'}). ¿Deseas registrarlo de todas formas?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Registrar de Todas Formas',
                            onPress: async () => {
                                await doSave();
                            }
                        }
                    ]
                );
                setLoading(false);
                return;
            }

            // Si no hay duplicados, guardar directamente
            await doSave();
        } catch (e) {
            Alert.alert('Error', 'No se pudo verificar duplicados. Intenta de nuevo.');
            setLoading(false);
        }
    };

    const doSave = async () => {
        setLoading(true);
        const newPerson: Person = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            createdAt: new Date().toISOString(),
        };

        try {
            await savePerson(newPerson);
            Alert.alert('Éxito', 'Miembro registrado correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar el miembro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Registrar Miembro</Text>
                    <Text style={styles.subtitle}>Añade un nuevo miembro a la comunidad</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Juan Pérez"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>WhatsApp / Celular (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 3001234567"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo Electrónico (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. juan@email.com"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar Miembro'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.l,
        padding: 24,
        ...theme.shadows.card,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: 12,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: '#F9FAFB',
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        marginTop: 10,
        ...theme.shadows.default,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
