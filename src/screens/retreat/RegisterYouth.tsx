import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAddYouth } from '../../hooks/useRetreat';
import { Cake, Target as TargetIcon, GraduationCap, User, UserCheck } from 'lucide-react-native';

// Lógica de detección automática (Heurística simple para nombres en español)
const guessGender = (name: string): 'male' | 'female' => {
    const n = name.trim().toLowerCase();
    if (!n) return 'male';
    // Nombres comunes que terminan en 'a' pero son hombres (excepciones)
    if (['luca', 'mika', 'andrea', 'bautista'].includes(n)) return 'male';
    // Si termina en 'a', suele ser mujer
    if (n.endsWith('a')) return 'female';
    return 'male';
};

export default function RegisterYouth() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [targetAmount, setTargetAmount] = useState('300000');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [milestones, setMilestones] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
    
    const { mutateAsync: addYouth, isPending } = useAddYouth();

    // Actualizar género automáticamente al escribir el nombre
    const handleNameChange = (text: string) => {
        setName(text);
        if (text.length > 2) {
            setGender(guessGender(text));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return;
        }

        try {
            await addYouth({
                name: name.trim(),
                phone: phone.trim(),
                targetAmount: parseFloat(targetAmount),
                birthDate: birthDate?.toISOString().split('T')[0],
                milestones: milestones.trim(),
                gender: gender,
            });
            Alert.alert('Éxito', 'Joven registrado correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'No se pudo registrar.');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Nuevo Joven</Text>
                    <Text style={styles.subtitle}>Retiro 2026</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ej. Juan Pérez" 
                            value={name} 
                            onChangeText={handleNameChange} 
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Género (Detección automática)</Text>
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
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                            <Cake color="#8B5CF6" size={20} />
                            <Text style={styles.dateSelectorText}>
                                {birthDate ? birthDate.toLocaleDateString() : 'Seleccionar fecha...'}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={birthDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setBirthDate(date);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Proyectos / Méritos (Graduaciones, Metas, etc.)</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            placeholder="Ej. Se gradúa de la Universidad en Diciembre..." 
                            value={milestones} 
                            onChangeText={setMilestones}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono (Opcional)</Text>
                        <TextInput style={styles.input} placeholder="Ej. 3001234567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Meta de Ahorro (COP)</Text>
                        <TextInput style={styles.input} value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />
                    </View>

                    <TouchableOpacity style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSave} disabled={isPending}>
                        <Text style={styles.buttonText}>{isPending ? 'Guardando...' : 'Registrar'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#8B5CF6', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
    formContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#F9FAFB' },
    textArea: { height: 100, textAlignVertical: 'top' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB', gap: 10 },
    dateSelectorText: { fontSize: 16, color: '#1F2937' },
    button: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    genderRow: { flexDirection: 'row', gap: 10 },
    genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', gap: 8 },
    genderButtonActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
    genderIcon: { fontSize: 20 },
    genderText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    genderTextActive: { color: '#8B5CF6' }
});
