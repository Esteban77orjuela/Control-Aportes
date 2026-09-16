'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { usePaymentsByPerson, useDeletePayment } from '@/hooks/usePayments';
import { usePeople, useDeletePerson } from '@/hooks/usePeople';
import { Payment } from '@/types';
import { theme } from '@/styles/theme';
import { formatCurrency } from '@/utils/money';
import { StorageRepository } from '@/data/repositories/StorageRepository';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function MemberDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; personId?: string }>();
  const personId = params.id ?? params.personId;

  const { data: people = [], refetch: refetchPeople } = usePeople();
  const { data: payments = [], isLoading, refetch } = usePaymentsByPerson(personId);
  const { mutateAsync: deletePayment, isPending: deleting } = useDeletePayment();
  const { mutateAsync: deletePerson, isPending: deletingPerson } = useDeletePerson();

  const person = people.find(p => p.id === personId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const duplicateKeys = new Set<string>(
    payments
      .map(p => `${p.month}-${p.year}`)
      .filter((key, index, arr) => arr.indexOf(key) !== index)
  );

  const handleDelete = async (payment: Payment) => {
    Alert.alert(
      'Eliminar aporte',
      `¿Estás seguro de eliminar el aporte de ${formatCurrency(payment.amount)} de ${MONTHS_FULL[payment.month]} ${payment.year}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(payment.id);
            try {
              await deletePayment(payment.id);
              refetch();
              Alert.alert('Eliminado', 'El aporte se eliminó correctamente.');
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el aporte.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (payment?: Payment, month?: number, year?: number) => {
    if (payment) {
      router.push(`/music/new?personId=${personId}&month=${payment.month}&year=${payment.year}&editPaymentId=${payment.id}`);
    } else if (month !== undefined && year !== undefined) {
      router.push(`/music/new?personId=${personId}&month=${month}&year=${year}`);
    } else {
      router.push(`/music/new?personId=${personId}`);
    }
  };

  const handleDeletePerson = () => {
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

  const handleMonthPress = (index: number) => {
    const paymentForMonth = payments.find(p => p.month === index && p.year === currentYear);

    if (paymentForMonth) {
      Alert.alert('Pago registrado', `Mes de ${MONTHS[index]}`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Editar pago',
          onPress: () => handleEdit(paymentForMonth),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(paymentForMonth.id);
              refetch();
            } catch (e: any) {
              Alert.alert('Error', `No se pudo eliminar el pago.${e?.message ? ` ${e.message}` : ''}`);
            }
          },
        },
      ]);
    } else if (index <= currentMonth) {
      Alert.alert('Registrar aporte', `¿Deseas registrar el aporte del mes de ${MONTHS[index]}?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Registrar', onPress: () => handleEdit(undefined, index, currentYear) },
      ]);
    }
  };

  const renderStatusGrid = () => (
    <View style={styles.gridContainer}>
      {MONTHS.map((month, index) => {
        const isPaid = payments.some(p => p.month === index && p.year === currentYear);
        const isFuture = index > currentMonth;
        const isPastDue = !isPaid && !isFuture;

        let bgColor = '#E5E7EB';
        let textColor = '#9CA3AF';

        if (isPaid) {
          bgColor = theme.colors.success;
          textColor = '#fff';
        } else if (isPastDue) {
          bgColor = theme.colors.error;
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

  const renderAnnualSummary = () => {
    const monthTotals = MONTHS_FULL.map((_, index) =>
      payments
        .filter(p => p.month === index && p.year === currentYear)
        .reduce((sum, p) => sum + p.amount, 0)
    );
    const yearTotal = monthTotals.reduce((sum, total) => sum + total, 0);
    const maxMonthTotal = Math.max(...monthTotals, 0);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.yearTotalRow}>
          <Text style={styles.yearTotalLabel}>Total {currentYear}</Text>
          <Text style={styles.yearTotalValue}>{formatCurrency(yearTotal)}</Text>
        </View>
        {MONTHS_FULL.map((monthName, index) => {
          const monthTotal = monthTotals[index];
          const hasPayment = monthTotal > 0;
          const isFuture = index > currentMonth;
          const barWidth =
            hasPayment && maxMonthTotal > 0
              ? `${Math.round((monthTotal / maxMonthTotal) * 100)}%`
              : '0%';

          return (
            <View key={index} style={styles.summaryRow}>
              <Text style={[styles.summaryMonth, isFuture && styles.summaryMonthFuture]}>
                {monthName}
              </Text>
              <View style={styles.summaryBarTrack}>
                {hasPayment && <View style={[styles.summaryBarFill, { width: barWidth as any }]} />}
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

  const onRefresh = async () => {
    await Promise.all([refetch(), refetchPeople()]);
  };

  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Miembro no encontrado</Text>
      </View>
    );
  }

  const signatureUri = (payment: Payment) =>
    payment.signatureBase64 || StorageRepository.getSignatureUrl(payment.signaturePath || '');

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[theme.colors.primary]} />
    }>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{person.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.memberName}>{person.name}</Text>
          {person.email && <Text style={styles.memberEmail}>{person.email}</Text>}
          {person.phone && <Text style={styles.memberPhone}>{person.phone}</Text>}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editMemberBtn} onPress={() => router.push(`/music/edit?personId=${personId}`)}>
              <Edit2 size={16} color="#fff" />
              <Text style={styles.headerActionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteMemberBtn} onPress={handleDeletePerson} disabled={deletingPerson}>
              <Trash2 size={16} color="#fff" />
              <Text style={styles.headerActionText}>{deletingPerson ? 'Borrando...' : 'Eliminar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado Anual ({currentYear})</Text>
        {renderStatusGrid()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen Anual {currentYear}</Text>
        {renderAnnualSummary()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listado de Pagos</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : payments.length === 0 ? (
          <Text style={styles.emptyText}>Sin pagos aún.</Text>
        ) : (
          payments
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View>
                    <Text style={styles.paymentMonth}>
                      {MONTHS_FULL[payment.month]} {payment.year}
                      {duplicateKeys.has(`${payment.month}-${payment.year}`) && (
                        <Text style={styles.duplicateBadge}> Duplicado</Text>
                      )}
                    </Text>
                    <Text style={styles.paymentDate}>{payment.date.slice(0, 10)}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                </View>
                <Text style={styles.signatureLabel}>Firma:</Text>
                <View style={styles.signaturePreview}>
                  <Image
                    source={{ uri: signatureUri(payment) }}
                    style={{ width: '100%', height: 80, resizeMode: 'contain' }}
                  />
                </View>
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnEdit]}
                    onPress={() => handleEdit(payment)}
                  >
                    <Edit2 size={16} color={theme.colors.primary} />
                    <Text style={styles.actionTextEdit}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDelete]}
                    onPress={() => handleDelete(payment)}
                    disabled={deletingId === payment.id}
                  >
                    {deletingId === payment.id ? (
                      <ActivityIndicator size="small" color={theme.colors.error} />
                    ) : (
                      <Trash2 size={16} color={theme.colors.error} />
                    )}
                    <Text style={styles.actionTextDelete}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { padding: 8, marginRight: 10 },
  headerInfo: { flex: 1, alignItems: 'center' },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarTextLarge: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  memberName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  memberEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  memberPhone: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  editMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  deleteMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.8)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  headerActionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '23%', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  gridText: { fontWeight: 'bold', fontSize: 12 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 8, padding: 15, borderWidth: 1, borderColor: theme.colors.border },
  yearTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  yearTotalLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  yearTotalValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryMonth: { width: 70, fontSize: 12, color: theme.colors.text },
  summaryMonthFuture: { color: '#9CA3AF' },
  summaryBarTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#F3F4F6', marginHorizontal: 8, overflow: 'hidden' },
  summaryBarFill: { height: '100%', borderRadius: 5, backgroundColor: theme.colors.success },
  summaryAmount: { width: 90, textAlign: 'right', fontSize: 12, fontWeight: '600', color: theme.colors.text },
  summaryAmountEmpty: { color: '#9CA3AF' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  paymentCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paymentDate: { color: theme.colors.textSecondary },
  paymentMonth: { fontWeight: 'bold', color: theme.colors.text, fontSize: 16 },
  duplicateBadge: { color: theme.colors.error, fontSize: 12, fontWeight: 'bold' },
  paymentAmount: { fontWeight: 'bold', color: theme.colors.success },
  signatureLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 5 },
  signaturePreview: { height: 80, backgroundColor: '#F9FAFB', borderRadius: 4 },
  paymentActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnEdit: { borderWidth: 1, borderColor: theme.colors.primary },
  actionBtnDelete: { borderWidth: 1, borderColor: theme.colors.error },
  actionTextEdit: { color: theme.colors.primary, fontWeight: '600' },
  actionTextDelete: { color: theme.colors.error, fontWeight: '600' },
  errorText: { textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary, fontSize: 16 },
});