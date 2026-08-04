import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { usePersonById, useUpdatePerson } from '../hooks/usePeople';
import { theme } from '../styles/theme';
import { Person, RootStackParamList } from '../types';

type EditMemberRouteProp = RouteProp<RootStackParamList, 'EditMember'>;

export default function EditMember() {
  const navigation = useNavigation();
  const route = useRoute<EditMemberRouteProp>();
  const { personId } = route.params;

  const personQuery = usePersonById(personId);
  const updatePersonMutation = useUpdatePerson();

  const person = personQuery.data as Person | undefined;
  const loading = personQuery.isLoading || personQuery.isPending;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadedPersonId, setLoadedPersonId] = useState<string | null>(null);

  if (person && loadedPersonId !== person.id) {
    setLoadedPersonId(person.id);
    setName(person.name);
    setEmail(person.email);
    setPhone(person.phone || '');
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre.');
      return;
    }

    if (!person) return;

    setSaving(true);
    const updatedPerson: Person = {
      ...person,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    try {
      await updatePersonMutation.mutateAsync(updatedPerson);
      Alert.alert('Éxito', 'Información actualizada.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el miembro.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Miembro no encontrado</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Editar Miembro</Text>
        <Text style={styles.subtitle}>Modifica los datos del miembro</Text>
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
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
