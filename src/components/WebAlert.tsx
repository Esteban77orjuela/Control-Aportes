'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert as RNAlert } from 'react-native';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertDialog {
  id: number;
  title?: string;
  message?: string;
  buttons: AlertButton[];
}

const queue: AlertDialog[] = [];
let idCounter = 0;
let renderDialog: (dialog: AlertDialog | null) => void = () => {};
let isInstalled = false;

export function installWebAlert() {
  if (isInstalled) return;
  isInstalled = true;

  // En la web `react-native` resuelve a `react-native-web`, cuya implementación
  // de Alert.alert es una función vacía (no-op). La reemplazamos por un modal
  // real para que todos los diálogos de confirmación (incluido "Eliminar")
  // funcionen en el navegador.
  RNAlert.alert = (title?: string, message?: string, buttons?: AlertButton[]) => {
    const dialog: AlertDialog = {
      id: ++idCounter,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    };
    queue.push(dialog);
    renderDialog(queue[0]);
  };
}

const closeCurrent = () => {
  queue.shift();
  renderDialog(queue.length > 0 ? queue[0] : null);
};

export function WebAlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<AlertDialog | null>(null);

  useEffect(() => {
    renderDialog = setCurrent;
    installWebAlert();
  }, []);

  const handlePress = (button?: AlertButton) => {
    const onPress = button?.onPress;
    closeCurrent();
    if (onPress) {
      // Espera un tick para que el modal se cierre antes de la navegación.
      setTimeout(onPress, 30);
    }
  };

  if (!current) {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.overlay} onStartShouldSetResponder={() => true} />
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {current.title ? <Text style={styles.title}>{current.title}</Text> : null}
          {current.message ? <Text style={styles.message}>{current.message}</Text> : null}
          <View style={styles.buttons}>
            {current.buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              return (
                <Pressable
                  key={index}
                  style={[styles.button, isDestructive && styles.buttonDestructive]}
                  onPress={() => handlePress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                    numberOfLines={2}
                  >
                    {button.text ?? 'Aceptar'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardContainer: {
    padding: 24,
  },
  card: {
    minWidth: 280,
    maxWidth: 360,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 24,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
  },
  button: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonDestructive: {
    backgroundColor: '#b91c1c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#94a3b8',
    fontWeight: '500',
  },
});