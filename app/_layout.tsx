import { Stack } from 'expo-router/build/layouts/Stack';
import { Providers } from './providers';

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(app)" />
      </Stack>
    </Providers>
  );
}