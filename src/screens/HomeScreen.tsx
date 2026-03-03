import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Music, Droplets, ChevronRight } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeNavProp>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Image
                            source={require('../../assets/church-logo.png')}
                            style={styles.logo}
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Control de Aportes</Text>
                            <Text style={styles.subtitle}>Restauración Poder y Vida</Text>
                        </View>
                    </View>
                    <View style={styles.welcomeBanner}>
                        <Text style={styles.welcomeText}>¿Qué deseas gestionar hoy?</Text>
                    </View>
                </View>

                {/* Módulos */}
                <View style={styles.modulesGrid}>
                    {/* Módulo 1: Aportes de Música */}
                    <TouchableOpacity
                        style={[styles.moduleCard, styles.musicCardShadow]}
                        onPress={() => navigation.navigate('Dashboard')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.moduleGradient, { backgroundColor: '#fff' }]}>
                            <View style={styles.moduleTop}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
                                    <Music size={28} color={theme.colors.primary} />
                                </View>
                                <View style={styles.moduleHeaderInfo}>
                                    <Text style={styles.moduleTitle}>Aportes de Música</Text>
                                    <Text style={styles.moduleStatus}>Gestión de Miembros</Text>
                                </View>
                            </View>
                            <Text style={styles.moduleDescription}>
                                Registra aportes mensuales, firmas digitales y genera reportes de contabilidad del grupo.
                            </Text>
                            <View style={[styles.moduleAction, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.moduleActionText}>Entrar al Módulo</Text>
                                <ChevronRight size={18} color="#fff" />
                            </View>
                        </View>
                        <View style={[styles.sideIndicator, { backgroundColor: theme.colors.primary }]} />
                    </TouchableOpacity>

                    {/* Módulo 2: Control de Bebidas */}
                    <TouchableOpacity
                        style={[styles.moduleCard, styles.beverageCardShadow]}
                        onPress={() => navigation.navigate('BeverageDashboard')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.moduleGradient, { backgroundColor: '#fff' }]}>
                            <View style={styles.moduleTop}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
                                    <Droplets size={28} color="#06B6D4" />
                                </View>
                                <View style={styles.moduleHeaderInfo}>
                                    <Text style={styles.moduleTitle}>Venta de Bebidas</Text>
                                    <Text style={styles.moduleStatus}>Inventario en Tiempo Real</Text>
                                </View>
                            </View>
                            <Text style={styles.moduleDescription}>
                                Control de stock de aguas y gaseosas, registro de ventas rápidas y cálculo de ganancias.
                            </Text>
                            <View style={[styles.moduleAction, { backgroundColor: '#06B6D4' }]}>
                                <Text style={styles.moduleActionText}>Entrar al Módulo</Text>
                                <ChevronRight size={18} color="#fff" />
                            </View>
                        </View>
                        <View style={[styles.sideIndicator, { backgroundColor: '#06B6D4' }]} />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerLine} />
                    <Text style={styles.footerText}>© {new Date().getFullYear()} Control de Aportes</Text>
                    <Text style={styles.footerSub}>Desarrollado por Esteban Orjuela</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        ...theme.shadows.default,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    headerTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
        fontWeight: '500',
    },
    welcomeBanner: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    welcomeText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    modulesGrid: {
        paddingHorizontal: 20,
        marginTop: -25,
        gap: 20,
    },
    moduleCard: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
    },
    musicCardShadow: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    beverageCardShadow: {
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    moduleGradient: {
        padding: 24,
    },
    sideIndicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 6,
    },
    moduleTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleHeaderInfo: {
        marginLeft: 15,
        flex: 1,
    },
    moduleTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    moduleStatus: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    moduleDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    moduleAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 15,
        gap: 8,
    },
    moduleActionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    footer: {
        marginTop: 30,
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    footerLine: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 15,
    },
    footerText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    footerSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
    },
});

