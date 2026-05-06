import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { useYouthById, useRetreatSavingsByYouth, useDeleteRetreatSaving } from '../../hooks/useRetreat';
import { RetreatService } from '../../services/RetreatService';
import { UserCog, Trash2, ChevronRight, Cake, GraduationCap, Plus } from 'lucide-react-native';

type YouthDetailsRouteProp = RouteProp<RootStackParamList, 'YouthDetails'>;

export default function YouthDetails() {
    const navigation = useNavigation<any>();
    const route = useRoute<YouthDetailsRouteProp>();
    const { youthId } = route.params;

    const { data: youth, isLoading: loadingYouth } = useYouthById(youthId);
    const { data: savings = [], isLoading: loadingSavings } = useRetreatSavingsByYouth(youthId);
    const { mutateAsync: deleteSaving } = useDeleteRetreatSaving();

    if (loadingYouth || loadingSavings) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    if (!youth) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>No se encontró el joven.</Text>
            </View>
        );
    }

    const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
    const remainingBalance = Math.max(youth.targetAmount - totalSaved, 0);
    const progressPercentage = Math.min((totalSaved / youth.targetAmount) * 100, 100);

    const handleDeleteSaving = (id: string) => {
        Alert.alert(
            'Eliminar Abono',
            '¿Estás seguro de que deseas eliminar este registro de abono?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSaving({ id, youthId });
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo eliminar el abono.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{youth.name}</Text>
                        <View style={styles.profileInfoRow}>
                            {youth.birthDate && (
                                <View style={styles.infoBadge}>
                                    <Cake color="#DDD6FE" size={14} />
                                    <Text style={styles.infoBadgeText}>
                                        {RetreatService.calculateAge(youth.birthDate)} años ({new Date(youth.birthDate + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })})
                                    </Text>
                                </View>
                            )}
                            {youth.phone && (
                                <Text style={styles.phone}> • {youth.phone}</Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => navigation.navigate('EditYouth', { youthId })}
                    >
                        <UserCog color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                {youth.milestones && (
                    <View style={styles.milestonesCard}>
                        <GraduationCap color="#8B5CF6" size={18} />
                        <Text style={styles.milestonesText} numberOfLines={2}>
                            {youth.milestones}
                        </Text>
                    </View>
                )}
                
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Ahorrado</Text>
                        <Text style={styles.statValuePositive}>${totalSaved.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Meta</Text>
                        <Text style={styles.statValue}>${youth.targetAmount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Faltante</Text>
                        <Text style={styles.statValueNegative}>${remainingBalance.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progressPercentage)}% completado</Text>
            </View>

            <Text style={styles.historyTitle}>Historial de Abonos</Text>

            <FlatList
                data={savings}
                keyExtractor={s => s.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.savingCard}>
                        <View style={styles.savingInfo}>
                            <Text style={styles.savingAmount}>+ ${item.amount.toLocaleString()}</Text>
                            <Text style={styles.savingDate}>
                                {new Date(item.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.savingRight}>
                            {item.signatureBase64 && (
                                <Image 
                                    source={{ uri: item.signatureBase64 }} 
                                    style={styles.signatureImage} 
                                    resizeMode="contain"
                                />
                            )}
                            <TouchableOpacity 
                                style={styles.deleteSavingButton}
                                onPress={() => handleDeleteSaving(item.id)}
                            >
                                <Trash2 color="#EF4444" size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay abonos registrados.</Text>
                }
            />

            {/* Floating Action Button para Abonar */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('NewRetreatSaving', { preselectedYouthId: youth.id })}
            >
                <Plus color="#fff" size={24} />
                <Text style={styles.fabText}>Abonar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#EF4444' },
    headerCard: { backgroundColor: '#8B5CF6', padding: 24, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    profileInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 6 },
    infoBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    editButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
    milestonesCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 10, marginBottom: 16 },
    milestonesText: { flex: 1, fontSize: 13, color: '#4B5563', fontStyle: 'italic' },
    name: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    phone: { fontSize: 14, color: '#DDD6FE' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16 },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    statValuePositive: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
    statValueNegative: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
    progressContainer: { width: '100%', height: 8, backgroundColor: '#DDD6FE', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBar: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
    progressText: { color: '#fff', textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
    historyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', margin: 20, marginBottom: 8 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    savingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    savingInfo: { flex: 1 },
    savingAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
    savingDate: { fontSize: 14, color: '#6B7280' },
    savingRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    signatureImage: { width: 80, height: 40, backgroundColor: '#F9FAFB', borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
    deleteSavingButton: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
