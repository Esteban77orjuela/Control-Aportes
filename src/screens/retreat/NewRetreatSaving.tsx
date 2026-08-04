import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { RootStackParamList } from '../../types';
import { ChevronDown, Search } from 'lucide-react-native';
import { useYouths, useAddRetreatSaving } from '../../hooks/useRetreat';
import { Youth } from '../../types';
import { theme } from '../../styles/theme';
import { parseMoneyInput } from '../../utils/money';

export default function NewRetreatSaving() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'NewRetreatSaving'>>();
  const { preselectedYouthId } = route.params || {};
  const signatureRef = useRef<SignatureViewRef>(null);

  const { data: youths = [] } = useYouths();
  const { mutateAsync: addSaving, isPending } = useAddRetreatSaving();

  const [manualYouth, setManualYouth] = useState<Youth | null>(null);
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Pre-seleccionar si viene de la ficha
  const selectedYouth =
    manualYouth ??
    (preselectedYouthId ? (youths.find(y => y.id === preselectedYouthId) ?? null) : null);

  const filteredYouths = youths.filter(y =>
    y.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSign = () => {
    const parsedAmount = parseMoneyInput(amount);
    if (!selectedYouth) {
      Alert.alert('Error', 'Debes seleccionar un joven.');
      return;
    }
    if (parsedAmount === null || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0.');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const onSave = async (signatureBase64: string) => {
    const parsedAmount = parseMoneyInput(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0.');
      return;
    }
    try {
      await addSaving({
        youthId: selectedYouth!.id,
        amount: parsedAmount,
        date: new Date().toISOString(),
        signatureBase64,
      });
      Alert.alert('Éxito', 'El abono se registró correctamente.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el abono.');
    }
  };

  const onClear = () => signatureRef.current?.clearSignature();

  return (
    <ScrollView style={styles.container} scrollEnabled={scrollEnabled}>
      <View style={styles.form}>
        <Text style={styles.label}>Seleccionar Joven</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
          <Text style={[styles.selectorText, !selectedYouth && { color: '#9CA3AF' }]}>
            {selectedYouth ? selectedYouth.name : 'Toca para seleccionar...'}
          </Text>
          <ChevronDown color="#6B7280" size={20} />
        </TouchableOpacity>

        <Text style={styles.label}>Monto del Abono (COP)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 50000"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Firma del Joven (Requerida)</Text>
        <View style={styles.signatureContainer}>
          <SignatureScreen
            ref={signatureRef}
            onOK={onSave}
            onBegin={() => setScrollEnabled(false)}
            onEnd={() => setScrollEnabled(true)}
            descriptionText="Firma aquí"
            clearText="Limpiar"
            confirmText="Guardar"
            webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0px; width: 100%; height: 100%;} .m-signature-pad--footer {display: none;}`}
          />
        </View>

        <View style={styles.signatureButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Limpiar Firma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isPending && styles.disabled]}
            onPress={handleSign}
            disabled={isPending}
          >
            <Text style={styles.saveButtonText}>
              {isPending ? 'Guardando...' : 'Confirmar y Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Youth Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Joven</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Search color="#9CA3AF" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredYouths}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setManualYouth(item);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemSub}>Meta: ${item.targetAmount.toLocaleString()}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 16 },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectorText: { fontSize: 16, color: '#1F2937' },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  signatureContainer: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
  },
  signatureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  saveButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.5 },
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeModalText: { color: '#8B5CF6', fontSize: 16, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 16 },
  modalItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  modalItemName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  modalItemSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
