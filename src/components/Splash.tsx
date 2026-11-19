// Loading splash for native apps (the web build uses the pure-CSS splash in
// app/+html.tsx, which runs before the JavaScript bundle arrives). Same look:
// bobbing pixel spade, four cards dealt to the seats, stepped progress bar.
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Text, View, type ImageStyle } from 'react-native';
import { IMAGES } from '../assets/images';
import { COLORS, FONT } from '../constants/theme';

const PIX = { imageRendering: 'pixelated' } as unknown as ImageStyle;
const SEATS = [
  { suit: 'S', x: 0, y: -34 },
  { suit: 'H', x: 62, y: 0 },
  { suit: 'C', x: 0, y: 34 },
  { suit: 'D', x: -62, y: 0 },
];

export const Splash: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const [bob] = useState(() => new Animated.Value(0));
  const [deal] = useState(() => SEATS.map(() => new Animated.Value(reducedMotion ? 1 : 0)));
  const [fill] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return undefined;
    const anims = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -12, duration: 450, easing: Easing.step0, useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 450, easing: Easing.step0, useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.stagger(
            250,
            deal.map((v) => Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true })),
          ),
          Animated.delay(900),
          Animated.parallel(deal.map((v) => Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }))),
        ]),
      ),
      Animated.timing(fill, { toValue: 0.88, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [bob, deal, fill, reducedMotion]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Backyard Spades"
      style={{ flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', gap: 22 }}
    >
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Image source={{ uri: IMAGES['s-S'] }} style={[{ width: 88, height: 88 }, PIX]} />
      </Animated.View>
      <Text style={{ fontFamily: FONT.px, fontSize: 18, lineHeight: 27, textAlign: 'center', color: COLORS.ink }}>{'BACKYARD\nSPADES'}</Text>
      <View
        style={{
          width: 220,
          height: 120,
          borderWidth: 4,
          borderColor: COLORS.ink,
          borderRadius: 10,
          backgroundColor: '#e7b9a4',
          boxShadow: `0 0 0 4px ${COLORS.woodDark}, 0 0 0 7px ${COLORS.ink}`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {SEATS.map((s, i) => (
          <Animated.View
            key={s.suit}
            style={{
              position: 'absolute',
              width: 34,
              height: 48,
              backgroundColor: COLORS.paper,
              borderWidth: 3,
              borderColor: COLORS.ink,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: deal[i],
              transform: [
                { translateX: deal[i].interpolate({ inputRange: [0, 1], outputRange: [0, s.x] }) },
                { translateY: deal[i].interpolate({ inputRange: [0, 1], outputRange: [90, s.y] }) },
              ],
            }}
          >
            <Image source={{ uri: IMAGES[`s-${s.suit}`] }} style={[{ width: 18, height: 18 }, PIX]} />
          </Animated.View>
        ))}
      </View>
      <View style={{ width: 220, height: 18, borderWidth: 3, borderColor: COLORS.ink, backgroundColor: COLORS.paper, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: COLORS.tomato,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
      <Text style={{ fontFamily: FONT.bodyX, fontSize: 15, color: COLORS.ink }}>Shuffling the deck…</Text>
    </View>
  );
};
