'use client';

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Pencil, Trash2, Plus, PiggyBank, Calendar, Phone, Cake } from 'lucide-react';
import { useYouthById, useRetreatSavingsByYouth, useDeleteRetreatSaving, useDeleteYouth } from '@/hooks/useRetreat';
import { RetreatService } from '@/services/RetreatService';
import { theme } from '@/styles/theme';

export default function YouthDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: youth, isLoading: loadingYouth } = useYouthById(id);
    const { data: savings = [], isLoading: loadingSavings } = useRetreatSavingsByYouth(id);
    const { mutateAsync: deleteSaving } = useDeleteRetreatSaving();
    const { mutateAsync: deleteYouth } = useDeleteYouth();

    if (loadingYouth) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!youth) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.notFound}>Joven no encontrado</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
                    <Text style={styles.primaryBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
    const progress = youth.targetAmount ? Math.min((totalSaved / youth.targetAmount) * 100, 100) : 0;
    const age = RetreatService.calculateAge(youth.birthDate);
    const isBirthday = RetreatService.isBirthdayThisWeek(youth.birthDate);

    const handleDeleteSaving = (id: string, amount: number) => {
        Alert.alert(
            'Eliminar Abono',
            `¿Eliminar el abono de $${amount.toLocaleString('es-CO')}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSaving({ id, youthId: id });
                            Alert.alert('Eliminado', 'El abono fue eliminado correctamente.');
                        } catch (e: any) {
                            Alert.alert('Error', e?.message || 'No se pudo eliminar el abono.');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteYouth = () => {
        Alert.alert(
            'Eliminar Joven',
            `¿Eliminar a ${youth.name} y todos sus abonos? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteYouth(id);
                            Alert.alert('Eliminado', 'El joven fue eliminado correctamente.', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (e: any) {
                            Alert.alert('Error', e?.message || 'No se pudo eliminar el joven.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <View style={{ width: 48 }} />
            </View>

            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{youth.gender === 'female' ? '👩' : '👨'}</Text>
                </View>
                <Text style={styles.name}>{youth.name}</Text>
                {isBirthday && (
                    <View style={styles.birthdayBadge}>
                        <Cake size={14} color="#F472B6" />
                        <Text style={styles.birthdayText}>Cumple esta semana</Text>
                    </View>
                )}
                <Text style={styles.age}>
                    {age !== null &&
                        `${age} años`
                    }
                </Text>
            </View>

            <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Progreso del Ahorro</Text>
                <Text style={styles.progressAmount}>
                    ${totalSaved.toLocaleString('es-CO')} <Text style={styles.progressOf}>/ ${youth.targetAmount.toLocaleString('es-CO')}</Text>
                </Text>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{Math.round(progress)}% de la meta</Text>
            </View>

            <View style={styles.infoCard}>
                {youth.birthDate && (
                    <View style={styles.infoRow}>
                        <Calendar size={16} color="#6B7280" />
                        <Text style={styles.infoText}>
                            Cumpleaños: {new Date(youth.birthDate + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                )}
                {youth.phone && (
                    <View style={styles.infoRow}>
                        <Phone size={16} color="#6B7280" />
                        <Text style={styles.infoText}>Teléfono: {youth.phone}</Text>
                    </View>
                )}
            </View>

            {youth.milestones ? (
                <View style={styles.milestonesCard}>
                    <Text style={styles.milestonesTitle}>Proyectos y Méritos</Text>
                    <Text style={styles.milestonesText}>{youth.milestones}</Text>
                </View>
            ) : null}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historial de Abonos</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push({ pathname: '/retreat/new', params: { preselectedYouthId: id } })}
                >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Abonar</Text>
                </TouchableOpacity>
            </View>

            {loadingSavings ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : savings.length === 0 ? (
                <View style={styles.emptyState}>
                    <PiggyBank size={40} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Aún no hay abonos registrados.</Text>
                </View>
            ) : (
                savings.map(s => (
                    <View key={s.id} style={styles.savingCard}>
                        <View style={styles.savingLeft}>
                            <Text style={styles.savingAmount}>${s.amount.toLocaleString('es-CO')}</Text>
                            <Text style={styles.savingDate}>
                                {new Date(s.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                            {s.signaturePath && (
                                <Image source={{ uri: s.signaturePath }} style={styles.signatureThumb} />
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSaving(s.id, s.amount)} style={styles.deleteButton}>
                            <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => router.push({ pathname: '/retreat/edit', params: { id } })}
                >
                    <Pencil size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteYouthButton]}
                    onPress={handleDeleteYouth}
                >
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Eliminar Joven</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 40 },
    header: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
    },
    backButton: { padding: 8 },
    avatarSection: { alignItems: 'center', marginTop: -20, marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5, marginBottom: 10 },
    avatarText: { fontSize: 44 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    age: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    birthdayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#FCE7F3', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    birthdayText: { fontSize: 13, color: '#EC4899', fontWeight: '600' },
    progressCard: { backgroundColor: '#fff', margin: 20, marginBottom: 12, marginTop: 8, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
    progressTitle: { fontSize: 14, color: '#6B7280' },
    progressAmount: { fontSize: 26, fontWeight: 'bold', color: '#8B5CF6', marginVertical: 12 },
    progressOf: { fontSize: 16, fontWeight: '400', color: '#9CA3AF' },
    progressTrack: { width: '100%', height: 10, backgroundColor: '#EDE9FE', borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 5 },
    progressPercent: { fontSize: 13, color: '#6B7280', marginTop: 8 },
    infoCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12, gap: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: '#374151' },
    milestonesCard: { backgroundColor: '#EDE9FE', marginHorizontal: 20, padding: 16, borderRadius: 12, marginBottom: 20 },
    milestonesTitle: { fontSize: 14, fontWeight: 'bold', color: '#6D28D9', marginBottom: 6 },
    milestonesText: { fontSize: 14, color: '#4C1D95', lineHeight: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    emptyState: { alignItems: 'center', marginTop: 10, opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
    savingCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
    savingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    savingAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
    savingDate: { fontSize: 13, color: '#9CA3AF' },
    signatureThumb: { width: 40, height: 30, borderRadius: 4, backgroundColor: '#F3F4F6' },
    deleteButton: { padding: 8 },
    actions: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 20 },
    actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12 },
    editButton: { backgroundColor: '#8B5CF6' },
    deleteYouthButton: { backgroundColor: '#EF4444' },
    actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    notFound: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
    primaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
    primaryBtnText: { color: '#fff', fontWeight: 'bold' },
});