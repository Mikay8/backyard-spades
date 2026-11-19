// 404 — any URL that isn't a screen. "4 ? 4" spelled in cards, Grandma
// wincing at the table, and a way back home.
import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { BtnP, BtnS, Frame, PixelCard, Screen, T, usePalette } from '../components/ui';
import { COLORS } from '../constants/theme';
import { useApp } from '../state/store';

/** Face-down card in the middle of the "404". */
const FaceDown: React.FC<{ spin: Animated.Value }> = ({ spin }) => (
  <Animated.View
    style={{
      width: 58,
      height: 84,
      borderWidth: 3,
      borderColor: COLORS.ink,
      borderRadius: 5,
      backgroundColor: '#fff4e2',
      overflow: 'hidden',
      boxShadow: `0 3px 0 ${COLORS.ink}`,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: spin.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) }],
    }}
    accessibilityLabel="A face-down card"
  >
    {Array.from({ length: 10 }).map((_, i) => (
      <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * 8, height: 4, backgroundColor: '#d9483b' }} />
    ))}
    <View style={{ backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 4, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      <T px fixed size={14}>
        ?
      </T>
    </View>
  </Animated.View>
);

export default function NotFound() {
  const pal = usePalette();
  const path = usePathname();
  const { settings } = useApp();
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (settings.reducedMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(spin, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(spin, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(spin, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, settings.reducedMotion]);

  return (
    <Screen contentStyle={{ paddingTop: 40, gap: 16, alignItems: 'stretch' }}>
      <Stack.Screen options={{ title: 'Page not found — Backyard Spades' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <PixelCard card={{ suit: 'S', rank: 4 }} />
        <FaceDown spin={spin} />
        <PixelCard card={{ suit: 'H', rank: 4 }} />
      </View>
      <T px size={28} color={pal.tomato} center accessibilityRole="header">
        404
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 }}>
        <Frame stem="grandma" mood="wince" size={72} label="Grandma Rose, puzzled" />
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.paper,
            borderWidth: 3,
            borderColor: COLORS.ink,
            borderRadius: 10,
            padding: 10,
            boxShadow: `0 3px 0 ${COLORS.ink}`,
          }}
        >
          <T x size={14}>
            “Now where did that card go? I swear it was right here.”
          </T>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <T x size={18} center>
          That card isn’t in the deck.
        </T>
        <T size={14} center>
          There’s no page at{' '}
          <T x size={14}>
            {path}
          </T>
          . It might have been shuffled away.
        </T>
      </View>
      <View style={{ gap: 6, marginTop: 6 }}>
        <BtnP label="BACK TO HOME" onPress={() => router.replace('/')} testID="not-found-home" />
        <BtnS label="How to Play" onPress={() => router.replace('/howto')} />
      </View>
    </Screen>
  );
}
