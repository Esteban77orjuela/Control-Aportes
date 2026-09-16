'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, Calendar, Search } from 'lucide-react';
import { usePeople } from '@/hooks/usePeople';
import { useAddPayment, useDeletePayment, usePaymentsByPerson } from '@/hooks/usePayments';
import { Person } from '@/types';
import { theme } from '@/styles/theme';
import { parseMoneyInput } from '@/utils/money';
import { SignaturePadComponent, SignaturePadRef } from '@/components/SignaturePad';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function NewPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string;
    month?: string;
    year?: string;
    editPaymentId?: string;
  }>();

  const preselectedPersonId = params.personId;
  const preselectedMonth = params.month ? parseInt(params.month, 10) : undefined;
  const preselectedYear = params.year ? parseInt(params.year, 10) : undefined;
  const editPaymentId = params.editPaymentId;

  const signatureRef = useRef<SignaturePadRef>(null);

  const { data: people = [] } = usePeople();
  const { mutateAsync: addPayment, isPending: saving } = useAddPayment();
  const { mutateAsync: deletePayment } = useDeletePayment();

  const [manualPerson, setManualPerson] = useState<Person | null>(null);
  const [amount, setAmount] = useState('');
  const initialDate =
    preselectedMonth !== undefined && preselectedYear !== undefined
      ? `${preselectedYear}-${String(preselectedMonth + 1).padStart(2, '0')}-01`
      : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [searchPeople, setSearchPeople] = useState('');
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null);

  const monthLocked = preselectedMonth !== undefined;

  const selectedPerson =
    manualPerson ??
    (preselectedPersonId ? (people.find(p => p.id === preselectedPersonId) ?? null) : null);

  const { data: personPayments = [] } = usePaymentsByPerson(selectedPerson?.id || '');

  const editingPayment = editPaymentId
    ? (personPayments.find(p => p.id === editPaymentId) ?? null)
    : null;

  useEffect(() => {
    if (editingPayment && loadedEditId !== editingPayment.id) {
      setLoadedEditId(editingPayment.id);
      setAmount(String(editingPayment.amount));
      setDate(editingPayment.date.slice(0, 10));
    }
  }, [editingPayment, loadedEditId]);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchPeople.toLowerCase())
  );

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleConfirm = () => {
    const signature = signatureRef.current?.getSignature();
    if (signature) {
      onSave(signature);
    }
  };

  const handleStart = () => {
    setScrollEnabled(false);
  };

  const handleEnd = () => {
    setScrollEnabled(true);
  };

  const sendWhatsAppNotification = (person: Person, amountValue: string, dateStr: string) => {
    if (!person.phone) return;

    const cleanPhone = person.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

    const parsedAmount = parseMoneyInput(amountValue) || 0;
    const prettyAmount = parsedAmount.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    const message = `⛪ *Control de Aportes*\n_Restauración Poder y Vida_\n\n¡Hola *${person.name}*! 😊\n\nQueremos confirmarte que hemos recibido tu aporte:\n\n💰 *Monto:* $${prettyAmount}\n📅 *Fecha:* ${dateStr}\n\n¡Muchas gracias por tu generosidad! 🙏✨\nQue Dios te bendiga abundantemente.`;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const onSave = async (signatureBase64: string) => {
    if (saving) return;

    const selectedDate = new Date(date.slice(0, 10) + 'T12:00:00');
    const parsedAmount = parseMoneyInput(amount);

    if (isNaN(selectedDate.getTime())) {
      Alert.alert('Fecha inválida', 'La fecha del aporte no es válida.');
      return;
    }

    if (!selectedPerson || parsedAmount === null || parsedAmount <= 0 || !signatureBase64 || signatureRef.current?.isEmpty()) {
      Alert.alert('Faltan datos', 'Asegúrate de seleccionar miembro, monto y firmar.');
      return;
    }

    const existingPayment = personPayments.find(
      p =>
        p.id !== editPaymentId &&
        p.month === selectedDate.getMonth() &&
        p.year === selectedDate.getFullYear()
    );
    if (existingPayment) {
      Alert.alert(
        'Pago duplicado',
        `Ya existe un aporte registrado para ${selectedPerson.name} en ${MONTH_NAMES[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}. Elimínalo desde el perfil del miembro si deseas registrarlo nuevamente.`
      );
      return;
    }

    try {
      if (editPaymentId) {
        await deletePayment(editPaymentId);
      }

      const newPayment = {
        personId: selectedPerson.id,
        amount: parsedAmount,
        date: date,
        month: selectedDate.getMonth(),
        year: selectedDate.getFullYear(),
        signatureBase64: signatureBase64,
      };

      await addPayment(newPayment);

      Alert.alert('Éxito', editPaymentId ? 'Pago actualizado.' : 'Pago registrado.', [
        {
          text: 'Enviar WhatsApp',
          onPress: () => {
            sendWhatsAppNotification(selectedPerson, amount, date);
            router.back();
          },
        },
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', `No se pudo guardar el pago.${e?.message ? ` ${e.message}` : ''}`);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDate(formattedDate);
    }
  };

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{editPaymentId ? 'Editar Aporte' : 'Nuevo Aporte'}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Miembro</Text>
          <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowMemberPicker(true)}>
            <Text style={[styles.pickerText, !selectedPerson && { color: '#9CA3AF' }]}>
              {selectedPerson ? selectedPerson.name : 'Seleccionar Miembro'}
            </Text>
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => (monthLocked ? null : setShowDatePicker(true))}
              >
                <Calendar size={18} color={theme.colors.textSecondary} />
                <Text style={styles.dateText}>{date}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={styles.webDateInput}
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

          <Text style={styles.label}>Firma del Aportante</Text>
          <View style={styles.signatureContainer}>
            <SignaturePadComponent
              ref={signatureRef}
              height={250}
              onBegin={handleStart}
              onEnd={handleEnd}
              disabled={saving}
            />
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Borrar Firma</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Guardando...' : 'Confirmar Aporte'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showMemberPicker} animationType="slide" transparent={true}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowMemberPicker(false)}>
            <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Miembro</Text>
                <TouchableOpacity onPress={() => { setShowMemberPicker(false); setSearchPeople(''); }}>
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
                />
              </View>

              <FlatList
                data={filteredPeople}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setManualPerson(item);
                      setShowMemberPicker(false);
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
          </Pressable>
        </Modal>

        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
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
  pickerText: { fontSize: 16, color: theme.colors.text },
  row: { flexDirection: 'row' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: '#F9FAFB',
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
  dateText: { fontSize: 15, color: theme.colors.text },
  webDateInput: { width: '100%', padding: 12, borderRadius: theme.borderRadius.s, borderWidth: 1, borderColor: theme.colors.border, fontSize: 15, marginTop: 8 },
  signatureContainer: {
    height: 250,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    overflow: 'hidden',
    marginTop: 5,
  },
  clearButton: { alignSelf: 'flex-end', padding: 8 },
  clearButtonText: { color: theme.colors.error, fontSize: 14 },
  saveButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.default,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeText: { color: theme.colors.primary, fontSize: 16 },
  pickerItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemText: { fontSize: 16, color: theme.colors.text },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTextSmall: { color: '#fff', fontWeight: 'bold' },
});