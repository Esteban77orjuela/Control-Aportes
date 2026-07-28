import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export const ConnectionBanner = () => {
  const status = useConnectionStatus();

  if (status === 'connected' || status === 'checking') return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Sin conexión a Supabase — usando datos locales</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
