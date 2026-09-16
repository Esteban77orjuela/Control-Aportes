import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default function AppVersion() {
  const appVersion = Constants.expoConfig?.version || '0.0.0';
  return <Text style={styles.text}>{`v${appVersion} · PWA`}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
});