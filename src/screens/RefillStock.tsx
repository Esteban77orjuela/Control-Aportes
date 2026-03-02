import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, PlusCircle, DollarSign, ChevronDown } from 'lucide-react-native';
import { RootStackParamList, Beverage } from '../types';
import { theme } from '../styles/theme';
import { getBeverages, refillBeverageStock } from '../utils/beverageStorage';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'RefillStock'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'RefillStock'>;

export default function RefillStock() {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<ScreenRouteProp>();

    const [loading, setLoading] = useState(true);
    const [beverages, setBeverages] = useState<Beverage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(route.params?.beverageId || null);
    const [quantityToAdd, setQuantityToAdd] = useState('');
    const [newCostPrice, setNewCostPrice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBeverages();
    }, []);

    const loadBeverages = async () => {
        setLoading(true);
        const data = await getBeverages();
        setBeverages(data);
        if (route.params?.beverageId) {
            const selected = data.find(b => b.id === route.params.beverageId);
            if (selected) {
                setNewCostPrice(selected.costPrice.toString());
            }
        }
        setLoading(false);
    };

    const handleSelect = (id: string) => {
        setSelectedId(id);
        const selected = beverages.find(b => b.id === id);
        if (selected) {
            setNewCostPrice(selected.costPrice.toString());
        }
    };

    const handleRefill = async () => {
        if (!selectedId) {
            Alert.alert('Error', 'Selecciona un producto del catálogo.');
            return;
        }
        if (!quantityToAdd || Number(quantityToAdd) <= 0) {
            Alert.alert('Error', 'Ingresa una cantidad válida a sumar.');
            return;
        }

        setSaving(true);
        try {
            await refillBeverageStock(
                selectedId,
                Number(quantityToAdd),
                newCostPrice ? Number(newCostPrice) : undefined
            );
            Alert.alert('¡Éxito!', 'Stock actualizado correctamente.');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar el stock.');
        } finally {
            setSaving(false);
        }
    };

    const selectedBeverage = beverages.find(b => b.id === selectedId);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#06B6D4" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.formTitle}>Abastecer Stock</Text>
                <Text style={styles.formSubtitle}>Suma unidades a un producto que ya existe en tu catálogo.</Text>

                {/* Selector de Producto */}
                <Text style={styles.label}>Selecciona el Producto</Text>
                <View style={styles.selectorContainer}>
                    {beverages.map((bev) => (
                        <TouchableOpacity
                            key={bev.id}
                            style={[
                                styles.option,
                                selectedId === bev.id && styles.optionSelected
                            ]}
                            onPress={() => handleSelect(bev.id)}
                        >
                            <View style={styles.optionInfo}>
                                <Text style={[styles.optionName, selectedId === bev.id && styles.textSelected]}>
                                    {bev.name}
                                </Text>
                                <Text style={styles.optionStock}>Stock actual: {bev.stock} uds</Text>
                            </View>
                            {selectedId === bev.id && <PlusCircle size={20} color="#06B6D4" />}
                        </TouchableOpacity>
                    ))}
                    {beverages.length === 0 && (
                        <Text style={styles.emptyText}>No hay productos en el catálogo. Crea uno primero.</Text>
                    )}
                </View>

                {selectedId && (
                    <View style={styles.formSection}>
                        <View style={styles.divider} />

                        {/* Cantidad a sumar */}
                        <Text style={styles.label}>¿Cuántas unidades compraste?</Text>
                        <View style={styles.inputContainer}>
                            <Package size={18} color={theme.colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                value={quantityToAdd}
                                onChangeText={setQuantityToAdd}
                                placeholder="Ej: 50"
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Precio Costo Actualizado */}
                        <Text style={styles.label}>Nuevo Precio de Compra (opcional)</Text>
                        <Text style={styles.helper}>Si el precio cambió, actualízalo aquí.</Text>
                        <View style={styles.inputContainer}>
                            <DollarSign size={18} color={theme.colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                value={newCostPrice}
                                onChangeText={setNewCostPrice}
                                placeholder="Ej: 1600"
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Resumen */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryText}>
                                Nuevo stock total: <Text style={styles.bold}>{(selectedBeverage?.stock || 0) + (Number(quantityToAdd) || 0)}</Text> unidades.
                            </Text>
                        </View>

                        {/* Botón Guardar */}
                        <TouchableOpacity
                            style={[styles.saveButton, saving && { opacity: 0.7 }]}
                            onPress={handleRefill}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Actualizando...' : 'Sumar al Inventario'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginTop: 12,
    },
    helper: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginTop: -4,
    },
    selectorContainer: {
        gap: 10,
    },
    option: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.default,
    },
    optionSelected: {
        borderColor: '#06B6D4',
        backgroundColor: '#ECFEFF',
    },
    optionInfo: {
        flex: 1,
    },
    optionName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    textSelected: {
        color: '#06B6D4',
    },
    optionStock: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    formSection: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        marginLeft: 10,
        paddingVertical: 12,
    },
    summaryCard: {
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 14,
        marginTop: 20,
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 15,
        color: theme.colors.text,
    },
    bold: {
        fontWeight: 'bold',
        color: '#06B6D4',
    },
    saveButton: {
        backgroundColor: '#06B6D4',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
        ...theme.shadows.default,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 20,
    },
});
