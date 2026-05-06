import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import Dashboard from './src/screens/Dashboard';
import RegisterPerson from './src/screens/RegisterPerson';
import NewPayment from './src/screens/NewPayment';
import MemberDetails from './src/screens/MemberDetails';
import EditMember from './src/screens/EditMember';
import BeverageDashboard from './src/screens/BeverageDashboard';
import AddBeverage from './src/screens/AddBeverage';
import RefillStock from './src/screens/RefillStock';

// Retreat 2026 Module
import RetreatDashboard from './src/screens/retreat/RetreatDashboard';
import RegisterYouth from './src/screens/retreat/RegisterYouth';
import NewRetreatSaving from './src/screens/retreat/NewRetreatSaving';
import YouthDetails from './src/screens/retreat/YouthDetails';
import EditYouth from './src/screens/retreat/EditYouth';

// Types & Utils
import { RootStackParamList } from './src/types';
import { theme } from './src/styles/theme';
import { migrateLocalDataToCloud } from './src/utils/storage';
import { setupNetworkListener, syncOfflineOperations } from './src/utils/offlineSync';

import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 1. Crear el cliente de React Query
const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Escuchar cambios en la sesión (Login/Logout)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Ejecutar migración solo cuando el usuario se loguea
        runMigration();
        syncOfflineOperations(); // Sincronizar cola offline
      }
    });

    // Iniciar escucha de red para sincronización automática
    setupNetworkListener();

    return () => subscription.unsubscribe();
  }, []);

  const runMigration = async () => {
    // Pequeño delay para asegurar que el usuario está listo
    setTimeout(async () => {
      const result = await migrateLocalDataToCloud();
      if (result.success && result.message) {
        Alert.alert("✅ Datos Sincronizados", result.message);
      } else if (!result.success && result.message) {
        Alert.alert("⚠️ Migración Pendiente", result.message);
      }
    }, 1000);
  };

  if (loading) {
    return null; // O un splash screen
  }

  // Si no hay sesión, mostramos la pantalla de Auth
  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthScreen />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: {
                backgroundColor: theme.colors.background,
              }
            }}
          >
            {/* Pantalla Principal */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />

            {/* === Módulo Aportes de Música === */}
            <Stack.Screen
              name="Dashboard"
              component={Dashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterPerson"
              component={RegisterPerson}
              options={{ title: 'Registro' }}
            />
            <Stack.Screen
              name="NewPayment"
              component={NewPayment}
              options={{ title: 'Nuevo Aporte' }}
            />
            <Stack.Screen
              name="MemberDetails"
              component={MemberDetails}
              options={{ title: 'Detalles del Miembro' }}
            />
            <Stack.Screen
              name="EditMember"
              component={EditMember}
              options={{ title: 'Editar Miembro' }}
            />

            {/* === Módulo Control de Bebidas === */}
            <Stack.Screen
              name="BeverageDashboard"
              component={BeverageDashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddBeverage"
              component={AddBeverage}
              options={{
                title: 'Nueva Categoría',
                headerStyle: { backgroundColor: '#06B6D4' },
              }}
            />
            <Stack.Screen
              name="RefillStock"
              component={RefillStock}
              options={{
                title: 'Abastecer Inventario',
                headerStyle: { backgroundColor: '#06B6D4' },
              }}
            />

            {/* === Módulo Retiro 2026 === */}
            <Stack.Screen
              name="RetreatDashboard"
              component={RetreatDashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterYouth"
              component={RegisterYouth}
              options={{ title: 'Registrar Joven', headerStyle: { backgroundColor: '#8B5CF6' } }}
            />
            <Stack.Screen
              name="NewRetreatSaving"
              component={NewRetreatSaving}
              options={{ title: 'Nuevo Abono', headerStyle: { backgroundColor: '#8B5CF6' } }}
            />
            <Stack.Screen
              name="YouthDetails"
              component={YouthDetails}
              options={{ title: 'Detalles del Joven', headerStyle: { backgroundColor: '#8B5CF6' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="EditYouth"
              component={EditYouth}
              options={{ title: 'Editar Perfil', headerStyle: { backgroundColor: '#8B5CF6' }, headerTintColor: '#fff' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
