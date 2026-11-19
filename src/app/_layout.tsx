import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../constants/theme';
import { AppProvider } from '../state/store';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PressStart2P_400Regular, Nunito_700Bold, Nunito_800ExtraBold });
  // Wait briefly for the pixel font so the first frame isn't a fallback face;
  // if loading fails the app still runs on the system font.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: COLORS.cream }} />;
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.cream } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pick" />
        <Stack.Screen name="partner" />
        <Stack.Screen name="shed" />
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
