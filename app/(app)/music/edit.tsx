'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, User, Mail, Phone, Save, Loader } from 'lucide-react';
import { usePeople, useUpdatePerson, useDeletePerson } from '@/hooks/usePeople';
import { Person } from '@/types';
import { theme } from '@/styles/theme';

export default function EditMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ personId: string }>();
  const { personId } = params;

  const { data: people = [], refetch: refetchPeople } = usePeople();
  const { mutateAsync: updatePerson, isPending: saving } = useUpdatePerson();
  const { mutateAsync: deletePerson, isPending: deleting } = useDeletePerson();

  const person = people.find(p => p.id === personId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (person) {
      setName(person.name);
      setEmail(person.email || '');
      setPhone(person.phone || '');
    }
  }, [person]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'El correo no es válido.');
      return;
    }

    try {
      await updatePerson({ id: personId, name: name.trim(), email: email.trim(), phone: phone.trim(), createdAt: new Date().toISOString() });
      Alert.alert('Éxito', 'Miembro actualizado correctamente.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', `No se pudo actualizar.${e?.message ? ` ${e.message}` : ''}`);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar miembro',
      `¿Estás seguro de eliminar a ${person?.name}? Esta acción no se puede deshacer y eliminará todos sus aportes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePerson(personId);
              await refetchPeople();
              Alert.alert('Eliminado', 'El miembro fue eliminado correctamente.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert('Error', `No se pudo eliminar el miembro.${e?.message ? ` ${e.message}` : ''}`);
            }
          },
        },
      ]
    );
  };

  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Miembro no encontrado</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Miembro</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <User size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo (opcional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Phone size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Teléfono (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <Loader size={20} color="#fff" /> : <> <Save size={20} color="#fff" /> <Text style={styles.saveButtonText}>Guardar Cambios</Text> </>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            <Text style={styles.deleteButtonText}>{deleting ? 'Eliminando...' : 'Eliminar Miembro'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { padding: 8, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, ...theme.shadows.card },
  inputGroup: { marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.colors.text },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, marginTop: 8, ...theme.shadows.default },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
  deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  errorText: { textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary, fontSize: 16 },
});