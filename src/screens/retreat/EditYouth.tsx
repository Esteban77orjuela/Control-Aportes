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
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useYouthById, useUpdateYouth, useDeleteYouth } from '../../hooks/useRetreat';
import { RootStackParamList } from '../../types';
import { Trash2, Save, Cake } from 'lucide-react-native';

type EditYouthRouteProp = RouteProp<RootStackParamList, 'EditYouth'>;

export default function EditYouth() {
  const navigation = useNavigation();
  const route = useRoute<EditYouthRouteProp>();
  const { youthId } = route.params;

  const { data: youth, isLoading } = useYouthById(youthId);
  const { mutateAsync: updateYouth, isPending: isUpdating } = useUpdateYouth();
  const { mutateAsync: deleteYouth, isPending: isDeleting } = useDeleteYouth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetAmount, setTargetAmount] = useState('300000');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [milestones, setMilestones] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loadedYouthId, setLoadedYouthId] = useState<string | null>(null);

  if (youth && loadedYouthId !== youth.id) {
    setLoadedYouthId(youth.id);
    setName(youth.name);
    setPhone(youth.phone || '');
    setTargetAmount(youth.targetAmount.toString());
    setBirthDate(youth.birthDate ? new Date(youth.birthDate + 'T00:00:00') : null);
    setMilestones(youth.milestones || '');
    setGender(youth.gender || 'male');
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }

    try {
      await updateYouth({
        id: youthId,
        name: name.trim(),
        phone: phone.trim(),
        targetAmount: parseFloat(targetAmount),
        birthDate: birthDate?.toISOString().split('T')[0],
        milestones: milestones.trim(),
        gender: gender,
        createdAt: youth?.createdAt || '',
      });
      Alert.alert('Éxito', 'Información actualizada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Joven',
      '¿Estás seguro de que deseas eliminar a este joven? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteYouth(youthId);
              Alert.alert('Éxito', 'Joven eliminado correctamente.');
              // @ts-ignore
              navigation.popToTop();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>{youth?.name}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
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
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meta de Ahorro (COP)</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isUpdating && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isUpdating || isDeleting}
          >
            <Save color="#fff" size={20} />
            <Text style={styles.buttonText}>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={isUpdating || isDeleting}
          >
            <Trash2 color="#EF4444" size={20} />
            <Text style={styles.deleteButtonText}>Eliminar Joven</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  formContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 4 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  dateSelectorText: { fontSize: 16, color: '#1F2937' },
  button: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
