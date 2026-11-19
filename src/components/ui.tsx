// Shared UI bits. Pixel-art images render from base64 data URIs (src/assets).
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import { IMAGES } from '../assets/images';
import { COLORS } from '../constants/theme';
import { STAT_LABELS, STAT_ORDER, type PartnerDef, type Stats } from '../constants/partners';
import { isRed, rankLabel, SUIT_SYMBOL, type Card } from '../engine/cards';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.ink },
  subtitle: { fontSize: 15, color: COLORS.inkSoft, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginTop: 24, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, color: COLORS.ink },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: COLORS.paper,
    borderWidth: 2,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.45 },
  card: {
    backgroundColor: COLORS.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  small: { fontSize: 13, color: COLORS.inkSoft },
  pill: {
    backgroundColor: COLORS.grass,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export const Btn: React.FC<{
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  testID?: string;
}> = ({ label, onPress, primary, disabled, testID }) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    disabled={disabled}
    style={[primary ? styles.primaryBtn : styles.secondaryBtn, disabled ? styles.disabledBtn : null]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Text style={primary ? styles.primaryBtnText : styles.secondaryBtnText}>{label}</Text>
  </Pressable>
);

export const ToggleRow: React.FC<{
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ label, hint, value, onChange, disabled }) => (
  <Pressable
    onPress={() => !disabled && onChange(!value)}
    disabled={disabled}
    style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: disabled ? 0.5 : 1 }]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>{label}</Text>
      {hint ? <Text style={styles.small}>{hint}</Text> : null}
    </View>
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? COLORS.grass : '#D8D2C0',
        justifyContent: 'center',
        paddingHorizontal: 3,
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
    </View>
  </Pressable>
);

/** Pixel-art portrait from a data URI. `stem` is the file stem, e.g. 'grandma'. */
export const Portrait: React.FC<{
  stem: string;
  mood?: 'happy' | 'neutral' | 'wince';
  size?: number;
  grey?: boolean;
}> = ({ stem, mood = 'neutral', size = 48, grey }) => {
  const key = `${stem}-${mood}`;
  const uri = IMAGES[key] ?? IMAGES[`${stem}-neutral`] ?? IMAGES['grandma-neutral'];
  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        // Pixel art must stay crisp, not blurred.
        imageRendering: 'pixelated',
        opacity: grey ? 0.4 : 1,
      } as ImageStyle}
      resizeMode="contain"
    />
  );
};

/** App wordmark: the spade icon (base64 data URI — the PNG itself is binary
 *  and cannot go through the GitHub connector) beside the name. Brief §12.1
 *  calls for a small spade mark with the wordmark. */
export const Wordmark: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      source={{ uri: IMAGES['app-icon'] }}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        imageRendering: 'pixelated',
      } as ImageStyle}
      resizeMode="contain"
    />
    <Text style={{ fontSize: size * 0.55, fontWeight: '900', color: COLORS.ink, marginLeft: 10, letterSpacing: 0.5 }}>
      BACKYARD SPADES
    </Text>
  </View>
);

/** Small quirk/item icon, e.g. 'i-glasses'. */
export const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 16 }) => (
  <Image
    source={{ uri: IMAGES[name] }}
    style={{ width: size, height: size, imageRendering: 'pixelated' } as ImageStyle}
    resizeMode="contain"
  />
);

export const StatBars: React.FC<{ stats: Stats; large?: boolean }> = ({ stats, large }) => (
  <View style={{ marginTop: 8 }}>
    {STAT_ORDER.map((key) => (
      <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
        <Text style={{ width: large ? 150 : 132, fontSize: 12, color: COLORS.inkSoft }}>
          {STAT_LABELS[key]}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <View
              key={n}
              style={{
                width: large ? 14 : 10,
                height: 8,
                borderRadius: 4,
                marginRight: 3,
                backgroundColor: n <= stats[key] ? COLORS.grass : '#E5DCC3',
              }}
            />
          ))}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.ink }}>{stats[key]}</Text>
      </View>
    ))}
  </View>
);

/** Promised vs won with dots, e.g. "Promised 3 • Won 2". */
export const PromiseDots: React.FC<{ promised: number; won: number; label?: string }> = ({
  promised,
  won,
  label,
}) => (
  <View>
    {label ? <Text style={styles.small}>{label}</Text> : null}
    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>
      Promised {promised} • Won {won}
    </Text>
    <View style={{ flexDirection: 'row', marginTop: 4 }}>
      {Array.from({ length: Math.max(promised, won, 1) }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            marginRight: 3,
            backgroundColor: i < won ? COLORS.grass : i < promised ? '#E5DCC3' : '#F0EAD6',
            borderWidth: 1,
            borderColor: i < promised ? COLORS.grass : '#D8D2C0',
          }}
        />
      ))}
    </View>
  </View>
);

/** A face-up playing card. */
export const PlayingCard: React.FC<{
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  large?: boolean;
  dimmed?: boolean;
}> = ({ card, onPress, disabled, highlighted, large, dimmed }) => {
  const w = large ? 64 : 46;
  const h = large ? 88 : 64;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={{
        width: w,
        height: h,
        backgroundColor: COLORS.paper,
        borderRadius: 8,
        borderWidth: highlighted ? 3 : 1.5,
        borderColor: highlighted ? COLORS.accent : COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
        opacity: dimmed ? 0.45 : 1,
      }}
      accessibilityLabel={`${rankLabel(card.rank)} of ${card.suit === 'S' ? 'spades' : card.suit === 'H' ? 'hearts' : card.suit === 'D' ? 'diamonds' : 'clubs'}`}
    >
      <Text style={{ fontSize: large ? 22 : 17, fontWeight: '800', color: isRed(card) ? COLORS.cardRed : COLORS.cardBlack }}>
        {rankLabel(card.rank)}
      </Text>
      <Text style={{ fontSize: large ? 22 : 17, color: isRed(card) ? COLORS.cardRed : COLORS.cardBlack }}>
        {SUIT_SYMBOL[card.suit]}
      </Text>
    </Pressable>
  );
};

/** Face-down card back (count shown separately by the caller). */
export const CardBack: React.FC<{ small?: boolean }> = ({ small }) => (
  <View
    style={{
      width: small ? 30 : 40,
      height: small ? 42 : 56,
      backgroundColor: COLORS.grassDark,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: COLORS.paper,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color: COLORS.paper, fontSize: small ? 12 : 16 }}>♠</Text>
  </View>
);

export const PartnerBlurb: React.FC<{ partner: PartnerDef }> = ({ partner }) => (
  <View>
    <Text style={styles.body}>{partner.goodWith}</Text>
    <Text style={[styles.body, { marginTop: 4 }]}>{partner.watchOut}</Text>
  </View>
);
