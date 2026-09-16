import { useEffect } from 'react';
import { Stack } from 'expo-router/build/layouts/Stack';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="music/index" />
      <Stack.Screen name="music/pending" />
      <Stack.Screen name="music/register" />
      <Stack.Screen name="music/new" />
      <Stack.Screen name="music/[id]" />
      <Stack.Screen name="music/edit" />
      <Stack.Screen name="beverages/index" />
      <Stack.Screen name="beverages/add" />
      <Stack.Screen name="beverages/refill" />
      <Stack.Screen name="retreat/index" />
      <Stack.Screen name="retreat/register" />
      <Stack.Screen name="retreat/new" />
      <Stack.Screen name="retreat/[id]" />
      <Stack.Screen name="retreat/edit" />
    </Stack>
  );
}