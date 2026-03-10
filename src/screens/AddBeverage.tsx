import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Droplets, DollarSign, Hash, Tag } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { theme } from '../styles/theme';
import { addBeverage } from '../utils/beverageStorage';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AddBeverage'>;

export default function AddBeverage() {
    const navigation = useNavigation<NavProp>();
    const [name, setName] = useState('');
    const [type, setType] = useState<'agua' | 'gaseosa'>('agua');
    const [costPrice, setCostPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [stock, setStock] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Ingresa el nombre del producto.');
            return;
        }
        if (!salePrice || Number(salePrice) <= 0) {
            Alert.alert('Error', 'Ingresa un precio de venta válido.');
            return;
        }
        if (!stock || Number(stock) <= 0) {
            Alert.alert('Error', 'Ingresa la cantidad en stock.');
            return;
        }

        setSaving(true);
        try {
            await addBeverage({
                name: name.trim(),
                type,
                costPrice: Number(costPrice) || 0,
                salePrice: Number(salePrice),
                stock: Number(stock),
            });
            Alert.alert('¡Listo!', `${name} agregado al inventario.`);
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar el producto.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.formTitle}>Nueva Categoría</Text>
                <Text style={styles.formSubtitle}>Define un nuevo producto en tu catálogo (nombre, precio base).</Text>

                {/* Tipo de bebida */}
                <Text style={styles.label}>Tipo de Producto</Text>
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[styles.typeOption, type === 'agua' && styles.typeSelected]}
                        onPress={() => setType('agua')}
                    >
                        <Text style={[styles.typeText, type === 'agua' && styles.typeTextSelected]}>💧 Agua</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeOption, type === 'gaseosa' && styles.typeGaseosaSelected]}
                        onPress={() => setType('gaseosa')}
                    >
                        <Text style={[styles.typeText, type === 'gaseosa' && styles.typeTextSelected]}>🥤 Gaseosa</Text>
                    </TouchableOpacity>
                </View>

                {/* Nombre */}
                <Text style={styles.label}>Nombre del Producto</Text>
                <View style={styles.inputContainer}>
                    <Tag size={18} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ej: Coca-Cola 350ml, Agua Cristal..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Precio Costo */}
                <Text style={styles.label}>Precio de Compra (costo)</Text>
                <View style={styles.inputContainer}>
                    <DollarSign size={18} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        value={costPrice}
                        onChangeText={setCostPrice}
                        placeholder="Ej: 1500"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Precio Venta */}
                <Text style={styles.label}>Precio de Venta</Text>
                <View style={styles.inputContainer}>
                    <DollarSign size={18} color="#10B981" />
                    <TextInput
                        style={styles.input}
                        value={salePrice}
                        onChangeText={setSalePrice}
                        placeholder="Ej: 2500"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Stock */}
                <Text style={styles.label}>Cantidad (unidades)</Text>
                <View style={styles.inputContainer}>
                    <Hash size={18} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        value={stock}
                        onChangeText={setStock}
                        placeholder="Ej: 24"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Ganancia estimada */}
                {costPrice && salePrice && stock ? (
                    <View style={styles.profitCard}>
                        <Text style={styles.profitTitle}>Ganancia Estimada</Text>
                        <Text style={styles.profitValue}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
                                .format((Number(salePrice) - Number(costPrice)) * Number(stock))}
                        </Text>
                        <Text style={styles.profitSub}>
                            Inversión: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
                                .format(Number(costPrice) * Number(stock))}
                        </Text>
                    </View>
                ) : null}

                {/* Botón Guardar */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Guardando...' : 'Agregar al Inventario'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeSelected: {
        backgroundColor: '#ECFEFF',
        borderColor: '#06B6D4',
    },
    typeGaseosaSelected: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    typeTextSelected: {
        color: theme.colors.text,
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
    profitCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    profitTitle: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    profitValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#059669',
        marginTop: 4,
    },
    profitSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
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
});
