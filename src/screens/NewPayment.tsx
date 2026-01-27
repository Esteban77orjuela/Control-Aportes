import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Alert, ScrollView } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { useNavigation } from '@react-navigation/native';
import { ChevronDown, Calendar, Search } from 'lucide-react-native';
import { getPeople, savePayment } from '../utils/storage';
import { Person } from '../types';
import { theme } from '../styles/theme';

export default function NewPayment() {
    const navigation = useNavigation();
    const signatureRef = useRef<SignatureViewRef>(null);

    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [signature, setSignature] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    useEffect(() => {
        loadPeople();
    }, []);

    const loadPeople = async () => {
        const list = await getPeople();
        setPeople(list);
    };

    const handleSignature = (signature: string) => {
        setSignature(signature); // base64
    };

    const handleEmpty = () => {
        setSignature(null);
    };

    const handleClear = () => {
        signatureRef.current?.clearSignature();
        setSignature(null);
    };

    const handleConfirm = () => {
        signatureRef.current?.readSignature();
    };

    // Prevent ScrollView from hijacking touch
    const handleStart = () => {
        setScrollEnabled(false);
    };

    const handleEnd = () => {
        setScrollEnabled(true);
    };

    // Called after readSignature triggers onOK
    const onSave = async (signatureBase64: string) => {
        if (!selectedPerson || !amount || !signatureBase64) {
            Alert.alert("Faltan datos", "Asegúrate de seleccionar miembro, monto y firmar.");
            return;
        }

        setSaving(true);
        const dateObj = new Date(date);

        try {
            await savePayment({
                id: Date.now().toString(),
                personId: selectedPerson.id,
                amount: parseFloat(amount),
                date: date,
                month: dateObj.getMonth(), // 0-11
                year: dateObj.getFullYear(),
                signatureBase64: signatureBase64
            });
            Alert.alert("Éxito", "Pago registrado.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar el pago.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 50 }}
            scrollEnabled={scrollEnabled} // Dynamically enable/disable scroll
        >
            <View style={styles.header}>
                <Text style={styles.title}>Nuevo Aporte</Text>
            </View>

            <View style={styles.formCard}>
                {/* Person Selector */}
                <Text style={styles.label}>Miembro</Text>
                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setPickerVisible(true)}>
                    <Text style={[styles.pickerText, !selectedPerson && { color: '#9CA3AF' }]}>
                        {selectedPerson ? selectedPerson.name : "Seleccionar Miembro"}
                    </Text>
                    <ChevronDown size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {/* Date & Amount */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.label}>Monto</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                        />
                    </View>
                </View>

                {/* Signature */}
                <Text style={styles.label}>Firma del Aportante</Text>
                <View style={styles.signatureContainer}>
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={onSave}
                        onEmpty={handleEmpty}
                        onBegin={handleStart}
                        onEnd={handleEnd}
                        descriptionText="Firme aquí"
                        clearText="Borrar"
                        confirmText="Guardar"
                        webStyle={`
                            .m-signature-pad { box-shadow: none; border: none; }
                            .m-signature-pad--body { border: none; }
                            .m-signature-pad--footer { display: none; margin: 0px; } 
                            body,html { 
                                width: 100%; height: 100%; 
                                touch-action: none; 
                                overflow: hidden;
                            }
                        `}
                        style={styles.signatureCanvas}
                    />
                </View>
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Borrar Firma</Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleConfirm}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Confirmar Aporte"}</Text>
                </TouchableOpacity>
            </View>

            {/* Modal Picker */}
            <Modal visible={pickerVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccionar Miembro</Text>
                        <TouchableOpacity onPress={() => setPickerVisible(false)}>
                            <Text style={styles.closeText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={people}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.pickerItem}
                                onPress={() => {
                                    setSelectedPerson(item);
                                    setPickerVisible(false);
                                }}
                            >
                                <View style={styles.avatarSmall}>
                                    <Text style={styles.avatarTextSmall}>{item.name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.pickerItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    header: {
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.l,
        padding: 20,
        ...theme.shadows.card,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginTop: 10,
    },
    pickerTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: 12,
        backgroundColor: '#F9FAFB',
    },
    pickerText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    row: {
        flexDirection: 'row',
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
    signatureContainer: {
        height: 250,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        overflow: 'hidden',
        marginTop: 5,
    },
    signatureCanvas: {
        flex: 1,
        width: '100%',
    },
    clearButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    clearButtonText: {
        color: theme.colors.error,
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        marginTop: 20,
        ...theme.shadows.default,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        color: theme.colors.primary,
        fontSize: 16,
    },
    pickerItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarTextSmall: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
