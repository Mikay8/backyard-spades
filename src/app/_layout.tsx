import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Splash } from '../components/Splash';
import { COLORS } from '../constants/theme';
import { AppProvider, useApp } from '../state/store';

const IS_WEB = Platform.OS === 'web';
/** Native: show the animated splash at least this long so the deal plays once. */
const MIN_SPLASH_MS = 1600;

// Native: keep the static launch image up until the animated splash mounts.
if (!IS_WEB) void SplashScreen.preventAutoHideAsync().catch(() => undefined);

declare global {
  // Set by the inline script in app/+html.tsx (web only).
  var __bootDone: (() => void) | undefined;
}

/** Holds the app behind the splash until fonts and saved data are ready. */
const BootGate: React.FC<{ fontsReady: boolean; children: React.ReactNode }> = ({ fontsReady, children }) => {
  const { loaded } = useApp();
  const [minDone, setMinDone] = useState(IS_WEB);
  const ready = fontsReady && loaded && minDone;

  useEffect(() => {
    if (IS_WEB) return undefined;
    void SplashScreen.hideAsync().catch(() => undefined);
    const t = setTimeout(() => setMinDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && IS_WEB) globalThis.__bootDone?.();
  }, [ready]);

  if (!ready) {
    // Web: the HTML splash (or reload progress bar) is showing on top.
    return IS_WEB ? <View style={{ flex: 1, backgroundColor: COLORS.cream }} /> : <Splash />;
  }
  return <>{children}</>;
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PressStart2P_400Regular, Nunito_700Bold, Nunito_800ExtraBold });
  // If font loading fails the app still runs on the system font.
  const fontsReady = fontsLoaded || !!fontError;
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <BootGate fontsReady={fontsReady}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.cream } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="pick" />
          <Stack.Screen name="partner" />
          <Stack.Screen name="shed" />
          <Stack.Screen name="coins" />
          <Stack.Screen name="game" />
          <Stack.Screen name="tutorial" />
          <Stack.Screen name="howto" />
          <Stack.Screen name="family" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="result" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </BootGate>
    </AppProvider>
  );
}
