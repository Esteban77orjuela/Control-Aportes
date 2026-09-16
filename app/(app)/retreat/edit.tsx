'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Cake, Trash2, ArrowLeft } from 'lucide-react';
import { useYouthById, useUpdateYouth, useDeleteYouth } from '@/hooks/useRetreat';

export default function EditYouth() {
    const router = useRouter();
    const { youthId } = useLocalSearchParams<{ youthId: string }>();

    const { data: youth, isLoading } = useYouthById(youthId);
    const { mutateAsync: updateYouth, isPending } = useUpdateYouth();
    const { mutateAsync: deleteYouth } = useDeleteYouth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [milestones, setMilestones] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

    useEffect(() => {
        if (youth) {
            setName(youth.name || '');
            setPhone(youth.phone || '');
            setTargetAmount(String(youth.targetAmount || ''));
            setBirthDate(youth.birthDate ? youth.birthDate.slice(0, 10) : '');
            setMilestones(youth.milestones || '');
            setGender(youth.gender || 'male');
        }
    }, [youth]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    if (!youth) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.notFound}>Joven no encontrado</Text>
            </View>
        );
    }

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return;
        }

        try {
            await updateYouth({
                ...youth,
                name: name.trim(),
                phone: phone.trim(),
                targetAmount: parseFloat(targetAmount || '0'),
                birthDate: birthDate || undefined,
                milestones: milestones.trim(),
                gender,
            });
            Alert.alert('Éxito', 'Perfil actualizado.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar.');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Eliminar Joven',
            `¿Eliminar a ${youth.name} y sus abonos? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteYouth(youth.id);
                            Alert.alert('Eliminado', 'El joven fue eliminado correctamente.', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (e: any) {
                            Alert.alert('Error', e?.message || 'No se pudo eliminar el joven.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView behavior="height" style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Editar Joven</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Género</Text>
                        <View style={styles.genderRow}>
                            <TouchableOpacity
                                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                                onPress={() => setGender('male')}
                            >
                                <Text style={styles.genderIcon}>👨</Text>
                                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Hombre</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                                onPress={() => setGender('female')}
                            >
                                <Text style={styles.genderIcon}>👩</Text>
                                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Mujer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Cumpleaños</Text>
                        <View style={styles.dateSelector}>
                            <Cake color="#8B5CF6" size={20} />
                            <input
                                    type="date"
                                    style={styles.webDateInput}
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Proyectos / Méritos</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={milestones}
                            onChangeText={setMilestones}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono (Opcional)</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Meta de Ahorro (COP)</Text>
                        <TextInput style={styles.input} value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />
                    </View>

                    <TouchableOpacity style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSave} disabled={isPending}>
                        <Text style={styles.buttonText}>{isPending ? 'Guardando...' : 'Guardar Cambios'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Trash2 size={16} color="#EF4444" />
                        <Text style={styles.deleteButtonText}>Eliminar este joven</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    header: { backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    backButton: { padding: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    formContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, margin: 20, elevation: 4 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#F9FAFB' },
    textArea: { height: 100, textAlignVertical: 'top' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', gap: 10 },
    webDateInput: { flex: 1, fontSize: 16, backgroundColor: 'transparent', color: '#1F2937', borderWidth: 0, outlineWidth: 0 } as any,
    button: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20, padding: 12 },
    deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
    genderRow: { flexDirection: 'row', gap: 10 },
    genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', gap: 8 },
    genderButtonActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
    genderIcon: { fontSize: 20 },
    genderText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    genderTextActive: { color: '#8B5CF6' },
    notFound: { fontSize: 16, color: '#6B7280' },
});