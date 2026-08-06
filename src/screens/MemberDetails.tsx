import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Edit2 } from 'lucide-react-native';
import { usePersonById, useDeletePerson } from '../hooks/usePeople';
import { usePaymentsByPerson, useDeletePayment } from '../hooks/usePayments';
import { StorageRepository } from '../data/repositories/StorageRepository';
import { Person, Payment, RootStackParamList } from '../types';
import { theme } from '../styles/theme';
import AppVersion from '../components/AppVersion';

type MemberDetailsRouteProp = RouteProp<RootStackParamList, 'MemberDetails'>;
type MemberDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemberDetails'>;

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = [
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MemberDetails() {
  const route = useRoute<MemberDetailsRouteProp>();
  const navigation = useNavigation<MemberDetailsNavigationProp>();
  const { personId } = route.params;

  const personQuery = usePersonById(personId);
  const paymentsQuery = usePaymentsByPerson(personId);
  const deletePersonMutation = useDeletePerson();
  const deletePaymentMutation = useDeletePayment();

  const person = personQuery.data as Person | undefined;
  const payments = (paymentsQuery.data as Payment[] | undefined) || [];
  const loading = personQuery.isLoading || personQuery.isPending;

  useFocusEffect(
    useCallback(() => {
      personQuery.refetch();
      paymentsQuery.refetch();
    }, [personQuery, paymentsQuery])
  );

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Miembro',
      '¿Estás seguro de que deseas eliminar a este miembro? Esta acción también borrará todos sus pagos registrados y no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonMutation.mutateAsync(personId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(
                'Error',
                `No se pudo eliminar el miembro.${e?.message ? ` ${e.message}` : ''}`
              );
            }
          },
        },
      ]
    );
  };

  const handleDeletePayment = (payment: Payment) => {
    Alert.alert(
      'Eliminar Pago',
      `¿Eliminar el aporte de ${MONTHS_FULL[payment.month]} ${payment.year} por ${formatCurrency(payment.amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMutation.mutateAsync(payment.id);
            } catch (e: any) {
              Alert.alert(
                'Error',
                `No se pudo eliminar el pago.${e?.message ? ` ${e.message}` : ''}`
              );
            }
          },
        },
      ]
    );
  };

  const duplicateKeys = new Set<string>(
    payments
      .map(p => `${p.month}-${p.year}`)
      .filter((key, index, arr) => arr.indexOf(key) !== index)
  );

  const renderStatusGrid = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const handleMonthPress = (index: number) => {
      const paymentForMonth = payments.find(p => p.month === index && p.year === currentYear);

      if (paymentForMonth) {
        Alert.alert('Pago registrado', `Mes de ${MONTHS[index]}`, [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Editar pago',
            onPress: () => {
              navigation.navigate('NewPayment', {
                personId,
                month: index,
                year: currentYear,
                editPaymentId: paymentForMonth.id,
              });
            },
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deletePaymentMutation.mutateAsync(paymentForMonth.id);
              } catch (e: any) {
                Alert.alert(
                  'Error',
                  `No se pudo eliminar el pago.${e?.message ? ` ${e.message}` : ''}`
                );
              }
            },
          },
        ]);
      } else if (index <= currentMonth) {
        Alert.alert(
          'Registrar aporte',
          `¿Deseas registrar el aporte del mes de ${MONTHS[index]}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Registrar',
              onPress: () => {
                navigation.navigate('NewPayment', {
                  personId,
                  month: index,
                  year: currentYear,
                });
              },
            },
          ]
        );
      }
    };

    return (
      <View style={styles.gridContainer}>
        {MONTHS.map((month, index) => {
          // Check if paid in this month & year
          const isPaid = payments.some(p => p.month === index && p.year === currentYear);
          const isFuture = index > currentMonth;
          const isPastDue = !isPaid && !isFuture;

          let bgColor = '#E5E7EB'; // Gray (Future)
          let textColor = '#9CA3AF';

          if (isPaid) {
            bgColor = theme.colors.success; // Green
            textColor = '#fff';
          } else if (isPastDue) {
            bgColor = theme.colors.error; // Red
            textColor = '#fff';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.gridItem, { backgroundColor: bgColor }]}
              onPress={() => handleMonthPress(index)}
              disabled={isFuture}
            >
              <Text style={[styles.gridText, { color: textColor }]}>{month}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAnnualSummary = () => {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthTotals = MONTHS_FULL.map((_, index) =>
      payments
        .filter(p => p.month === index && p.year === year)
        .reduce((sum, p) => sum + p.amount, 0)
    );
    const yearTotal = monthTotals.reduce((sum, total) => sum + total, 0);
    const maxMonthTotal = Math.max(...monthTotals, 0);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.yearTotalRow}>
          <Text style={styles.yearTotalLabel}>Total {year}</Text>
          <Text style={styles.yearTotalValue}>{formatCurrency(yearTotal)}</Text>
        </View>
        {MONTHS_FULL.map((monthName, index) => {
          const monthTotal = monthTotals[index];
          const hasPayment = monthTotal > 0;
          const isFuture = index > currentMonth;
          const barWidth =
            hasPayment && maxMonthTotal > 0
              ? (`${Math.round((monthTotal / maxMonthTotal) * 100)}%` as const)
              : '0%';

          return (
            <View key={index} style={styles.summaryRow}>
              <Text style={[styles.summaryMonth, isFuture && styles.summaryMonthFuture]}>
                {monthName}
              </Text>
              <View style={styles.summaryBarTrack}>
                {hasPayment && <View style={[styles.summaryBarFill, { width: barWidth }]} />}
              </View>
              <Text style={[styles.summaryAmount, !hasPayment && styles.summaryAmountEmpty]}>
                {hasPayment ? formatCurrency(monthTotal) : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const signatureUri =
      item.signatureBase64 || StorageRepository.getSignatureUrl(item.signaturePath || '');
    const monthKey = `${item.month}-${item.year}`;
    const isDuplicate = duplicateKeys.has(monthKey);
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View>
            <Text style={styles.paymentMonth}>
              {MONTHS_FULL[item.month]} {item.year}
              {isDuplicate && <Text style={styles.duplicateBadge}> Duplicado</Text>}
            </Text>
            <Text style={styles.paymentDate}>{item.date.slice(0, 10)}</Text>
          </View>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <Text style={styles.signatureLabel}>Firma:</Text>
        <View style={styles.signaturePreview}>
          <Image
            source={{ uri: signatureUri }}
            style={{ width: '100%', height: 80, resizeMode: 'contain' }}
          />
        </View>
        <View style={styles.paymentActions}>
          <TouchableOpacity
            style={styles.actionBtnEdit}
            onPress={() =>
              navigation.navigate('NewPayment', {
                personId,
                month: item.month,
                year: item.year,
                editPaymentId: item.id,
              })
            }
          >
            <Edit2 size={16} color={theme.colors.primary} />
            <Text style={styles.actionTextEdit}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnDelete}
            onPress={() => handleDeletePayment(item)}
          >
            <Trash2 size={16} color={theme.colors.error} />
            <Text style={styles.actionTextDelete}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!person)
    return (
      <View>
        <Text>Miembro no encontrado</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditMember', { personId })}
        >
          <Edit2 size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={24} color={theme.colors.error} />
        </TouchableOpacity>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>{person.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.email}>{person.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado Anual ({new Date().getFullYear()})</Text>
        {renderStatusGrid()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen Anual {new Date().getFullYear()}</Text>
        {renderAnnualSummary()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listado de Pagos</Text>
        {payments.map(item => (
          <View key={item.id} style={{ marginBottom: 10 }}>
            {renderPaymentItem({ item })}
          </View>
        ))}
        {payments.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#999' }}>Sin pagos aún.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Control de Aportes</Text>
        <Text style={styles.footerSubText}>Todos los derechos reservados por Esteban Orjuela</Text>
        <AppVersion />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    ...theme.shadows.default,
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
  },
  editBtn: {
    position: 'absolute',
    top: 20,
    right: 60, // Positioned next to delete button
    padding: 10,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  email: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  gridText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  paymentCard: {
    // Renamed from paymentItem to avoid conflict or confusion
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  yearTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  yearTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryMonth: {
    width: 70,
    fontSize: 12,
    color: theme.colors.text,
  },
  summaryMonthFuture: {
    color: '#9CA3AF',
  },
  summaryBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: theme.colors.success,
  },
  summaryAmount: {
    width: 90,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryAmountEmpty: {
    color: '#9CA3AF',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentDate: {
    color: theme.colors.textSecondary,
  },
  paymentMonth: {
    fontWeight: 'bold',
    color: theme.colors.text,
    fontSize: 16,
  },
  duplicateBadge: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 6,
  },
  actionTextEdit: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 6,
  },
  actionTextDelete: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  signatureLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  signaturePreview: {
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  footer: {
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  footerSubText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
