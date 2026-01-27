import React, { useEffect, useState } from 'react'; // Added imports
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Dashboard from './src/screens/Dashboard';
import RegisterPerson from './src/screens/RegisterPerson';
import NewPayment from './src/screens/NewPayment';
import MemberDetails from './src/screens/MemberDetails';
import EditMember from './src/screens/EditMember';

// Import Types
import { RootStackParamList } from './src/types';

import { theme } from './src/styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Dashboard"
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
          <Stack.Screen
            name="Dashboard"
            component={Dashboard}
            options={{
              headerShown: false // Custom header in Dashboard
            }}
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
