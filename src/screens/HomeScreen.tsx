import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Music,
  Droplets,
  ChevronRight,
  LogOut,
  User,
  RefreshCcw,
  WifiOff,
  Target,
} from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { RootStackParamList } from '../types';
import { theme } from '../styles/theme';
import { useHomeController } from '../hooks/useHomeController';

const { width } = Dimensions.get('window');

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { userEmail, pendingCount, syncing, syncNow, logout } = useHomeController();
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: async () => await logout(), style: 'destructive' },
    ]);
  };

  const handleManualSync = async () => {
    const result = await syncNow();
    if (result.processed > 0) {
      Alert.alert('✅ Sincronizado', `Se subieron ${result.processed} operaciones pendientes.`);
    } else if (result.errors > 0) {
      Alert.alert('⚠️ Error', 'No se pudieron subir todos los datos. Verifica tu conexión.');
    }
  };

  const handleCheckUpdates = async () => {
    if (__DEV__) {
      Alert.alert(
        'Modo desarrollo',
        'La búsqueda de actualizaciones solo funciona en la app instalada.'
      );
      return;
    }
    try {
      setCheckingUpdate(true);
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('Actualización disponible', 'Descargando e instalando...');
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert('Estás al día', 'Tu aplicación tiene la última versión.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo buscar actualizaciones. Verifica tu conexión.');
    } finally {
      setCheckingUpdate(false);
    }
  };

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
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <Image source={require('../../assets/church-logo.png')} style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title} numberOfLines={1}>
                Control de Aportes
              </Text>
              <Text style={styles.subtitle}>Restauración Poder y Vida</Text>
              {userEmail && (
                <View style={styles.userBadge}>
                  <User size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.userEmailText}>{userEmail}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>¿Qué deseas gestionar hoy?</Text>
          </View>
        </View>

        {/* Status Offline/Sync */}
        {pendingCount > 0 && (
          <TouchableOpacity style={styles.syncBanner} onPress={handleManualSync} disabled={syncing}>
            <View style={styles.syncIconContainer}>
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCcw size={16} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncText}>
                {syncing ? 'Sincronizando...' : `Tienes ${pendingCount} operaciones pendientes`}
              </Text>
              <Text style={styles.syncSubtext}>Toca para intentar subir a la nube ahora</Text>
            </View>
            {!syncing && <WifiOff size={16} color="rgba(255,255,255,0.7)" />}
          </TouchableOpacity>
        )}

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
                Registra aportes mensuales, firmas digitales y genera reportes de contabilidad del
                grupo.
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
                Control de stock de aguas y gaseosas, registro de ventas rápidas y cálculo de
                ganancias.
              </Text>
              <View style={[styles.moduleAction, { backgroundColor: '#06B6D4' }]}>
                <Text style={styles.moduleActionText}>Entrar al Módulo</Text>
                <ChevronRight size={18} color="#fff" />
              </View>
            </View>
            <View style={[styles.sideIndicator, { backgroundColor: '#06B6D4' }]} />
          </TouchableOpacity>

          {/* Módulo 3: Retiro 2026 */}
          <TouchableOpacity
            style={[styles.moduleCard, styles.retreatCardShadow]}
            onPress={() => navigation.navigate('RetreatDashboard')}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleGradient, { backgroundColor: '#fff' }]}>
              <View style={styles.moduleTop}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Target size={28} color="#8B5CF6" />
                </View>
                <View style={styles.moduleHeaderInfo}>
                  <Text style={styles.moduleTitle}>Ahorros Retiro 2026</Text>
                  <Text style={styles.moduleStatus}>Metas Individuales</Text>
                </View>
              </View>
              <Text style={styles.moduleDescription}>
                Registra abonos firmados por los jóvenes para el retiro, monitorea su progreso y
                meta.
              </Text>
              <View style={[styles.moduleAction, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.moduleActionText}>Entrar al Módulo</Text>
                <ChevronRight size={18} color="#fff" />
              </View>
            </View>
            <View style={[styles.sideIndicator, { backgroundColor: '#8B5CF6' }]} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.updateSection}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleCheckUpdates}
            disabled={checkingUpdate}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <RefreshCcw size={16} color={theme.colors.primary} />
            )}
            <Text style={styles.updateButtonText}>
              {checkingUpdate ? 'Buscando...' : 'Buscar actualizaciones'}
            </Text>
          </TouchableOpacity>
        </View>
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
    position: 'relative',
    ...theme.shadows.default,
  },
  logoutButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 50, // Espacio para el botón de logout
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
    marginTop: 5,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  userEmailText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
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
  syncBanner: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.default,
  },
  syncIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  syncText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  syncSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
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
  retreatCardShadow: {
    shadowColor: '#8B5CF6',
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
  updateSection: {
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.card,
  },
  updateButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
