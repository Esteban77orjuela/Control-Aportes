import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

const getUpdateId = (): string => {
  const id = Updates.updateId;
  if (!id) return 'dev';
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
};

export default function AppVersion() {
  const appVersion = Constants.expoConfig?.version || '0.0.0';
  return <Text style={styles.text}>{`v${appVersion} · upd ${getUpdateId()}`}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
});
