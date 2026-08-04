import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { usePeople } from '../hooks/usePeople';
import { usePayments } from '../hooks/usePayments';
import { RootStackParamList, Person } from '../types';
import { theme } from '../styles/theme';

type PendingMembersNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PendingMembers'>;

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function PendingMembers() {
  const navigation = useNavigation<PendingMembersNavigationProp>();

  const { data: people = [], isLoading } = usePeople();
  const { data: payments = [] } = usePayments();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const changeMonth = (delta: number) => {
    const d = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  const pendingPeople = people.filter(
    p =>
      !payments.some(
        pay => pay.personId === p.id && pay.month === selectedMonth && pay.year === selectedYear
      )
  );

  const renderPersonItem = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={styles.pendingCard}
      onPress={() => navigation.navigate('MemberDetails', { personId: item.id })}
    >
      <View style={[styles.avatar, { backgroundColor: theme.colors.error }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.pendingText}>Sin aporte este mes</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)}>
          <ChevronLeft size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </Text>
        <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)}>
          <ChevronRight size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pendingPeople}
        keyExtractor={item => item.id}
        renderItem={renderPersonItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={{ marginTop: 30 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>¡Todos al día! 🎉</Text>
              <Text style={styles.emptySubText}>
                Todos los miembros aportaron en {MONTH_NAMES[selectedMonth]}.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    ...theme.shadows.default,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pendingCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: theme.borderRadius.m,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    ...theme.shadows.default,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.error,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
