import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppProvider } from '../state/store';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pick" />
        <Stack.Screen name="game" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="howto" />
        <Stack.Screen name="family" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="result" />
      </Stack>
    </AppProvider>
  );
}
