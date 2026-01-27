import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users, DollarSign, Activity, Plus, UserPlus } from 'lucide-react-native';
import { getDashboardStats } from '../utils/storage';
import { RootStackParamList, Person } from '../types';
import { theme } from '../styles/theme';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount); // Assuming COP or generic currency
};

export default function Dashboard() {
    const navigation = useNavigation<DashboardScreenNavigationProp>();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalMembers: number;
        totalTransactions: number;
        totalAmount: number;
        peopleStats: (Person & { totalContributed: number })[];
    } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                <Text style={styles.appName}>Control de Aportes</Text>
                <Text style={styles.appSubName}>Restauración Poder y Vida</Text>
                <View style={styles.versicleContainer}>
                    <Text style={styles.versicleText}>
                        "Seréis enriquecidos en todo para toda generosidad"
                    </Text>
                    <Text style={styles.versicleRef}>(2 Corintios 9:11)</Text>
                </View>
            </View>
        </View>
    );

    const renderStats = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <View style={[styles.iconContext, { backgroundColor: '#E0E7FF' }]}>
                    <Users size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.statLabel}>Miembros</Text>
                <Text style={styles.statValue}>{stats?.totalMembers || 0}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={[styles.iconContext, { backgroundColor: '#D1FAE5' }]}>
                    <DollarSign size={24} color={theme.colors.secondary} />
                </View>
                <Text style={styles.statLabel}>Recaudado</Text>
                <Text style={styles.statValue}>{formatCurrency(stats?.totalAmount || 0)}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={[styles.iconContext, { backgroundColor: '#FEF3C7' }]}>
                    <Activity size={24} color={theme.colors.accent} />
                </View>
                <Text style={styles.statLabel}>Transacc.</Text>
                <Text style={styles.statValue}>{stats?.totalTransactions || 0}</Text>
            </View>
        </View>
    );

    const renderPersonItem = ({ item }: { item: Person & { totalContributed: number } }) => (
        <TouchableOpacity
            style={styles.memberCard}
            onPress={() => navigation.navigate('MemberDetails', { personId: item.id })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
            <View style={styles.memberAmount}>
                <Text style={styles.amountText}>{formatCurrency(item.totalContributed)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            {renderHeader()}

            <View style={styles.contentContainer}>
                {renderStats()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ranking de Aportes</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={stats?.peopleStats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPersonItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay miembros registrados.</Text>
                            </View>
                        }
                        ListFooterComponent={
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>© {new Date().getFullYear()} Control de Aportes</Text>
                                <Text style={styles.footerSubText}>Todos los derechos reservados por Esteban Orjuela</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.colors.secondary, marginRight: 16 }]}
                    onPress={() => navigation.navigate('RegisterPerson')}
                >
                    <UserPlus color="#fff" size={24} />
                    <Text style={styles.fabText}>Registrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => navigation.navigate('NewPayment')}
                >
                    <Plus color="#fff" size={24} />
                    <Text style={styles.fabText}>Aportar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        backgroundColor: theme.colors.primary,
        paddingTop: 60, // Status bar SafeArea replacement
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.default,
    },
    headerContent: {
        alignItems: 'center',
    },
    appName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        opacity: 0.9,
    },
    appSubName: {
        color: theme.colors.accent,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    versicleContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginTop: 5,
    },
    versicleText: {
        color: '#fff',
        fontStyle: 'italic',
        textAlign: 'center',
        fontSize: 14,
    },
    versicleRef: {
        color: '#E0E7FF',
        textAlign: 'center',
        fontSize: 12,
        marginTop: 4,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        marginTop: -25, // Overlap functionality
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.m,
        padding: 15,
        alignItems: 'center',
        width: '31%',
        ...theme.shadows.card,
    },
    iconContext: {
        padding: 8,
        borderRadius: 20,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    sectionHeader: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    listContent: {
        paddingBottom: 100,
    },
    memberCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: theme.borderRadius.m,
        marginBottom: 10,
        ...theme.shadows.default,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
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
    memberEmail: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    memberAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.secondary,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        ...theme.shadows.card,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
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
