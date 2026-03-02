import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    RefreshControl, ActivityIndicator, StatusBar, Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Droplets, Package, TrendingUp, ShoppingCart, Plus, Minus, Trash2, PlusCircle } from 'lucide-react-native';
import { RootStackParamList, Beverage } from '../types';
import { theme } from '../styles/theme';
import { getBeverageDashboardStats, sellBeverage, deleteBeverage, resetBeverageSales } from '../utils/beverageStorage';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'BeverageDashboard'>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
};

export default function BeverageDashboard() {
    const navigation = useNavigation<NavProp>();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getBeverageDashboardStats();
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

    const handleSell = async (beverage: Beverage) => {
        if (beverage.stock <= 0) {
            Alert.alert('Sin stock', `No hay unidades de ${beverage.name} disponibles.`);
            return;
        }

        Alert.alert(
            'Confirmar Venta',
            `¿Vender 1 ${beverage.name} por ${formatCurrency(beverage.salePrice)}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Vender',
                    onPress: async () => {
                        try {
                            await sellBeverage(beverage, 1);
                            loadData();
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo registrar la venta.');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async (beverage: Beverage) => {
        Alert.alert(
            'Eliminar Producto',
            `¿Estás seguro de eliminar "${beverage.name}" del inventario?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBeverage(beverage.id);
                            loadData();
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo eliminar el producto.');
                        }
                    }
                }
            ]
        );
    };

    const handleResetSales = async () => {
        Alert.alert(
            'Reiniciar Contabilidad',
            '¿Estás seguro de borrar todo el historial de ventas? Esto pondrá en cero "Vendido" y "Uds. Vendidas". El stock no se verá afectado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reiniciar en Cero',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetBeverageSales();
                            loadData();
                            Alert.alert('¡Listo!', 'La contabilidad ha sido reiniciada.');
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo reiniciar la contabilidad.');
                        }
                    }
                }
            ]
        );
    };

    const handleShowStockInfo = () => {
        Alert.alert(
            'Información de Inventario',
            `Tienes ${stats?.totalProducts || 0} categorías de productos.\nValor total invertido en stock: ${formatCurrency(stats?.inventoryValue || 0)}`
        );
    };

    const renderBeverageItem = ({ item }: { item: Beverage }) => {
        const isWater = item.type === 'agua';
        const accentColor = isWater ? '#06B6D4' : '#F59E0B';

        return (
            <View style={styles.beverageCard}>
                <View style={styles.beverageLeft}>
                    <View style={[styles.beverageIcon, { backgroundColor: isWater ? '#ECFEFF' : '#FEF3C7' }]}>
                        <Droplets size={22} color={accentColor} />
                    </View>
                    <View style={styles.beverageInfo}>
                        <Text style={styles.beverageName}>{item.name}</Text>
                        <Text style={styles.beverageType}>{isWater ? '💧 Agua' : '🥤 Gaseosa'}</Text>
                        <Text style={styles.beveragePrice}>Venta: {formatCurrency(item.salePrice)}</Text>
                    </View>
                </View>
                <View style={styles.beverageRight}>
                    <View style={[styles.stockBadge, item.stock <= 3 && styles.stockLow]}>
                        <Text style={[styles.stockText, item.stock <= 3 && styles.stockTextLow]}>
                            {item.stock} uds
                        </Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => handleSell(item)}
                        >
                            <Minus size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#06B6D4' }]}
                            onPress={() => navigation.navigate('RefillStock', { beverageId: item.id })}
                        >
                            <PlusCircle size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                            onPress={() => handleDelete(item)}
                        >
                            <Trash2 size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#06B6D4" />

            {/* Header */}
            <View style={styles.header}>
                <Droplets size={32} color="#fff" />
                <Text style={styles.headerTitle}>Control de Bebidas</Text>
                <Text style={styles.headerSubtitle}>Inventario y Ventas</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} onPress={handleShowStockInfo} activeOpacity={0.7}>
                    <Package size={20} color="#06B6D4" />
                    <Text style={styles.statValue}>{stats?.totalStock || 0}</Text>
                    <Text style={styles.statLabel}>En Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={handleResetSales} activeOpacity={0.7}>
                    <TrendingUp size={20} color="#10B981" />
                    <Text style={styles.statValue}>{formatCurrency(stats?.totalSalesRevenue || 0)}</Text>
                    <Text style={styles.statLabel}>Vendido</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={handleResetSales} activeOpacity={0.7}>
                    <ShoppingCart size={20} color="#F59E0B" />
                    <Text style={styles.statValue}>{stats?.totalUnitsSold || 0}</Text>
                    <Text style={styles.statLabel}>Uds. Vendidas</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de inventario */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Inventario</Text>
            </View>

            <FlatList
                data={stats?.beverages || []}
                keyExtractor={(item) => item.id}
                renderItem={renderBeverageItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} colors={['#06B6D4']} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Droplets size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No hay productos registrados.</Text>
                            <Text style={styles.emptySubText}>Agrega tu primer producto con el botón de abajo.</Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color="#06B6D4" style={{ marginTop: 30 }} />
                    )
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddBeverage')}
            >
                <Plus size={24} color="#fff" />
                <Text style={styles.fabText}>Nueva Categoría</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: '#06B6D4',
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.default,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: -20,
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        width: '31%',
        ...theme.shadows.card,
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    beverageCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...theme.shadows.default,
    },
    beverageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    beverageIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    beverageInfo: {
        flex: 1,
    },
    beverageName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    beverageType: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    beveragePrice: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
        marginTop: 2,
    },
    beverageRight: {
        alignItems: 'flex-end',
    },
    stockBadge: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    stockLow: {
        backgroundColor: '#FEF2F2',
    },
    stockText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#10B981',
    },
    stockTextLow: {
        color: '#EF4444',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 12,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#06B6D4',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 30,
        ...theme.shadows.card,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});
