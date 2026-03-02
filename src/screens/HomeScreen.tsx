import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Music, Droplets } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { theme } from '../styles/theme';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeNavProp>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/church-logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Control de Aportes</Text>
                <Text style={styles.subtitle}>Restauración Poder y Vida</Text>
                <View style={styles.divider} />
                <Text style={styles.welcomeText}>¿Qué deseas gestionar hoy?</Text>
            </View>

            {/* Módulos */}
            <View style={styles.modulesContainer}>
                {/* Módulo 1: Aportes de Música */}
                <TouchableOpacity
                    style={[styles.moduleCard, styles.musicCard]}
                    onPress={() => navigation.navigate('Dashboard')}
                    activeOpacity={0.85}
                >
                    <View style={styles.moduleIconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(79, 70, 229, 0.15)' }]}>
                            <Music size={36} color={theme.colors.primary} />
                        </View>
                    </View>
                    <Text style={styles.moduleTitle}>Aportes de Música</Text>
                    <Text style={styles.moduleDescription}>
                        Gestiona los aportes económicos del grupo de música. Registra miembros, pagos y genera reportes.
                    </Text>
                    <View style={[styles.moduleButton, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.moduleButtonText}>Ingresar →</Text>
                    </View>
                </TouchableOpacity>

                {/* Módulo 2: Control de Bebidas */}
                <TouchableOpacity
                    style={[styles.moduleCard, styles.beverageCard]}
                    onPress={() => navigation.navigate('BeverageDashboard')}
                    activeOpacity={0.85}
                >
                    <View style={styles.moduleIconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                            <Droplets size={36} color="#06B6D4" />
                        </View>
                    </View>
                    <Text style={styles.moduleTitle}>Control de Bebidas</Text>
                    <Text style={styles.moduleDescription}>
                        Inventario y ventas de aguas y gaseosas. Controla stock, precios y ganancias.
                    </Text>
                    <View style={[styles.moduleButton, { backgroundColor: '#06B6D4' }]}>
                        <Text style={styles.moduleButtonText}>Ingresar →</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>© {new Date().getFullYear()} Control de Aportes</Text>
                <Text style={styles.footerSub}>Todos los derechos reservados por Esteban Orjuela</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: 60,
        paddingBottom: 35,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.default,
    },
    logo: {
        width: 55,
        height: 55,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#F59E0B',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 12,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
        fontWeight: '500',
    },
    modulesContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 25,
        gap: 16,
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        ...theme.shadows.card,
    },
    musicCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    beverageCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#06B6D4',
    },
    moduleIconContainer: {
        marginBottom: 14,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 6,
    },
    moduleDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    moduleButton: {
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 25,
    },
    moduleButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        paddingVertical: 16,
        alignItems: 'center',
        opacity: 0.5,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    footerSub: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
});
