'use client';

import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PiggyBank, Signpost, User } from 'lucide-react';
import { useYouths, useAddRetreatSaving } from '@/hooks/useRetreat';
import { SignaturePadComponent, SignaturePadRef } from '@/components/SignaturePad';

export default function NewRetreatSaving() {
    const router = useRouter();
    const params = useLocalSearchParams<{ preselectedYouthId?: string }>();
    const { data: youths = [], isLoading: loadingYouths } = useYouths();
    const { mutateAsync: addSaving, isPending } = useAddRetreatSaving();

    const signatureRef = useRef<SignaturePadRef>(null);

    const [selectedYouthId, setSelectedYouthId] = useState<string | null>(params.preselectedYouthId || null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const focusedYouth = youths.find(y => y.id === selectedYouthId);

    const handleSubmit = async () => {
        if (!selectedYouthId) {
            Alert.alert('Error', 'Selecciona un joven.');
            return;
        }
        const amountNumber = parseFloat(amount);
        if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
            Alert.alert('Error', 'Ingresa un monto válido.');
            return;
        }

        const signature = signatureRef.current?.getSignature?.() || '';
        if (!signature) {
            Alert.alert('Firma requerida', 'Debes capturar la firma del joven para registrar el abono.');
            return;
        }

        try {
            await addSaving({
                youthId: selectedYouthId,
                amount: amountNumber,
                date: date || new Date().toISOString(),
                signatureBase64: signature,
            });
            Alert.alert('¡Listo!', 'Abono registrado con su firma de respaldo.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudo registrar el abono.');
        }
    };

    return (
        <KeyboardAvoidingView behavior="height" style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Registrar Abono</Text>
                    <Text style={styles.subtitle}>Suma a la meta de ahorro de un joven</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Selecciona el Joven</Text>
                        {loadingYouths ? (
                            <ActivityIndicator color="#8B5CF6" />
                        ) : (
                            <View style={styles.youthOptions}>
                                {youths.map(y => (
                                    <TouchableOpacity
                                        key={y.id}
                                        style={[styles.youthOption, selectedYouthId === y.id && styles.youthOptionActive]}
                                        onPress={() => setSelectedYouthId(y.id)}
                                    >
                                        <Text style={styles.genderIcon}>{y.gender === 'female' ? '👩' : '👨'}</Text>
                                        <Text style={[styles.youthOptionText, selectedYouthId === y.id && styles.youthOptionTextActive]}>
                                            {y.name}
                                        </Text>
                                        {selectedYouthId === y.id && <User size={16} color="#8B5CF6" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {focusedYouth && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Meta de {focusedYouth.name}</Text>
                            <Text style={styles.infoValue}>
                                ${focusedYouth.targetAmount.toLocaleString('es-CO')}
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Monto del Abono (COP)</Text>
                        <View style={styles.inputContainer}>
                            <PiggyBank size={18} color="#8B5CF6" />
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="Ej. 20000"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fecha</Text>
<input
                        type="date"
                        style={styles.webDateInput}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Firma de Respaldo</Text>
                        <Text style={styles.helper}>
                            El joven o su responsable debe firmar debajo para confirmar el respaldo del abono.
                        </Text>
                        <View style={styles.signatureArea}>
                            <SignaturePadComponent
                                ref={signatureRef}
                                height={160}
                                penColor="#1f2937"
                                backgroundColor="#ffffff"
                            />
                        </View>
                        <TouchableOpacity onPress={() => signatureRef.current?.clear?.()} style={styles.clearButton}>
                            <Signpost size={16} color="#EF4444" />
                            <Text style={styles.clearText}>Limpiar firma</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending}>
                        <Text style={styles.buttonText}>{isPending ? 'Guardando...' : 'Registrar Abono'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 24, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#8B5CF6', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#6B7280' },
    formContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    helper: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
    youthOptions: { gap: 8 },
    youthOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    youthOptionActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
    genderIcon: { fontSize: 16 },
    youthOptionText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
    youthOptionTextActive: { color: '#8B5CF6', fontWeight: '700' },
    infoCard: { backgroundColor: '#EDE9FE', padding: 14, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
    infoLabel: { fontSize: 12, color: '#6D28D9' },
    infoValue: { fontSize: 20, fontWeight: 'bold', color: '#6D28D9', marginTop: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB', gap: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
    webDateInput: { width: '100%', padding: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10 },
    signatureArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
    clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
    clearText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    button: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});