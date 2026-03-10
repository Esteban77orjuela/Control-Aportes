import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Alert, ScrollView, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [searchPeople, setSearchPeople] = useState('');

    useEffect(() => {
        loadPeople();
    }, []);

    const loadPeople = async () => {
        const list = await getPeople();
        setPeople(list);
    };

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(searchPeople.toLowerCase())
    );

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

    const sendWhatsAppNotification = (person: Person, amount: string, date: string) => {
        if (!person.phone) return;

        // Clean phone number (remove non-digits)
        const cleanPhone = person.phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

        const message = `⛪ *Control de Aportes*\n_Restauración Poder y Vida_\n\n¡Hola *${person.name}*! 😊\n\nQueremos confirmarte que hemos recibido tu aporte:\n\n💰 *Monto:* $${amount}\n📅 *Fecha:* ${date}\n\n¡Muchas gracias por tu generosidad! 🙏✨\nQue Dios te bendiga abundantemente.`;

        const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "WhatsApp no está instalado en este dispositivo.");
            }
        });
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setDate(formattedDate);
        }
    };

    // Called after readSignature triggers onOK
    const onSave = async (signatureBase64: string) => {
        // El picker garantiza el formato correcto, no hace falta regex
        const dateParts = date.split('-');
        const yearInt = parseInt(dateParts[0]);
        const monthInt = parseInt(dateParts[1]);
        const dayInt = parseInt(dateParts[2]);

        if (monthInt < 1 || monthInt > 12 || dayInt < 1 || dayInt > 31) {
            Alert.alert("Fecha Inválida", "El mes debe ser entre 01-12 y el día entre 01-31.");
            return;
        }

        if (!selectedPerson || !amount || !signatureBase64) {
            Alert.alert("Faltan datos", "Asegúrate de seleccionar miembro, monto y firmar.");
            return;
        }

        setSaving(true);
        try {
            await savePayment({
                id: Date.now().toString(),
                personId: selectedPerson.id,
                amount: parseFloat(amount),
                date: date,
                month: monthInt - 1, // Supabase/JS usan 0-11
                year: yearInt,
                signatureBase64: signatureBase64
            });

            Alert.alert("Éxito", "Pago registrado.", [
                {
                    text: "Enviar WhatsApp",
                    onPress: () => {
                        sendWhatsAppNotification(selectedPerson, amount, date);
                        navigation.goBack();
                    }
                },
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar el pago.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 50 }}
                scrollEnabled={scrollEnabled}
                keyboardShouldPersistTaps="handled"
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
                            <Text style={styles.label}>Fecha</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={theme.colors.textSecondary} />
                                <Text style={styles.dateText}>{date}</Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={new Date(date + 'T12:00:00')} // Forzar mediodía para evitar problemas de zona horaria
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
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
                            <TouchableOpacity onPress={() => { setPickerVisible(false); setSearchPeople(''); }}>
                                <Text style={styles.closeText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar por nombre..."
                                value={searchPeople}
                                onChangeText={setSearchPeople}
                                autoFocus={false}
                            />
                        </View>

                        <FlatList
                            data={filteredPeople}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setSelectedPerson(item);
                                        setPickerVisible(false);
                                        setSearchPeople('');
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
        </KeyboardAvoidingView>
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
        fontSize: 15,
        color: theme.colors.text,
        backgroundColor: '#F9FAFB',
    },
    helperText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: 12,
        backgroundColor: '#F9FAFB',
        gap: 10,
    },
    dateText: {
        fontSize: 15,
        color: theme.colors.text,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 10,
        fontSize: 16,
        color: theme.colors.text,
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
