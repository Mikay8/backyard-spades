// Shared UI kit — "Family Card Night — 16-bit Pixel Art" design.
// Ink outlines with hard drop shadows, cream/paper surfaces, wood-framed
// pixel portraits, Press Start 2P display type over Nunito body copy.
// Pixel-art images render from base64 data URIs (src/assets).
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMAGES } from '../assets/images';
import { OVERLAYS } from '../assets/overlays';
import { COLORS, CVM, FONT, PHONE_W } from '../constants/theme';
import { STAT_LABELS, STAT_ORDER, type PartnerDef, type Stats } from '../constants/partners';
import { isRed, rankLabel, SUIT_NAME, type Card } from '../engine/cards';
import { useApp } from '../state/store';

const PIX = { imageRendering: 'pixelated' } as unknown as ImageStyle;

/** Palette that respects colour-vision mode. */
export const usePalette = () => {
  const { settings } = useApp();
  return settings.colourVision
    ? { ...COLORS, tomato: CVM.tomato, accent: CVM.tomato, ok: CVM.ok, bad: CVM.bad, cvm: true }
    : { ...COLORS, cvm: false };
};

// ───────────────────────────── Text

/** App-wide text size boost (sizes in code are the design's; this scales them up). */
export const TEXT_SCALE = 1.12;

export const T: React.FC<
  TextProps & {
    px?: boolean;
    size?: number;
    x?: boolean;
    color?: string;
    center?: boolean;
    /** Keep the exact size (text inside cards and other fixed-size boxes). */
    fixed?: boolean;
    style?: StyleProp<TextStyle>;
  }
> = ({ px, size, x, color, center, fixed, style, children, ...rest }) => {
  const base = size ?? (px ? 12 : 14);
  const fs = fixed ? base : Math.round(base * TEXT_SCALE);
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: px ? FONT.px : x ? FONT.bodyX : FONT.body,
          fontSize: fs,
          lineHeight: Math.round(fs * (px ? 1.45 : 1.35)),
          color: color ?? COLORS.ink,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ───────────────────────────── Layout

/** Screen shell: cream ground, phone-width column centred on wide screens. */
export const Screen: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  overlay?: React.ReactNode;
}> = ({ children, header, footer, scroll = true, contentStyle, overlay }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: PHONE_W,
          alignSelf: 'center',
          paddingTop: insets.top,
        }}
      >
        {header}
        {scroll ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingHorizontal: 16, paddingBottom: 24 }, contentStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
        {footer ? (
          <View
            style={{
              borderTopWidth: 4,
              borderColor: COLORS.ink,
              backgroundColor: COLORS.paper,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16 + insets.bottom,
              gap: 10,
            }}
          >
            {footer}
          </View>
        ) : null}
        {overlay}
      </View>
    </View>
  );
};

/** Top bar: back/close icon button, pixel title, optional subtitle + right slot. */
export const Header: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  icon?: 'back' | 'close';
  right?: React.ReactNode;
  titleSize?: number;
  iconRight?: boolean;
}> = ({ title, subtitle, onBack, icon = 'back', right, titleSize = 14, iconRight }) => (
  <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
    {onBack && !iconRight ? <IconBtn icon={icon} onPress={onBack} label={icon === 'close' ? 'Close' : 'Back'} /> : null}
    <View style={{ flex: 1 }}>
      <T px size={titleSize} accessibilityRole="header">
        {title}
      </T>
      {subtitle ? <T size={13}>{subtitle}</T> : null}
    </View>
    {right}
    {onBack && iconRight ? <IconBtn icon={icon} onPress={onBack} label={icon === 'close' ? 'Close' : 'Back'} /> : null}
  </View>
);

// ───────────────────────────── Buttons

const usePress = () => {
  const { settings } = useApp();
  return settings.reducedMotion ? 0 : 1;
};

export const BtnP: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  pulse?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onPress, disabled, size = 14, pulse, testID, style }) => {
  const pal = usePalette();
  const motion = usePress();
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!pulse || !motion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -4, duration: 550, useNativeDriver: false }),
        Animated.timing(y, { toValue: 0, duration: 550, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, motion, y]);
  return (
    <Animated.View style={[{ transform: [{ translateY: y }] }, style]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => ({
          backgroundColor: disabled ? COLORS.disabled : pal.tomato,
          borderWidth: 4,
          borderColor: disabled ? COLORS.disabledLine : COLORS.ink,
          boxShadow: `0 ${pressed && motion ? 2 : 6}px 0 ${disabled ? COLORS.disabledLine : COLORS.ink}`,
          transform: [{ translateY: pressed && motion ? 4 : 0 }],
          minHeight: 56,
          paddingVertical: 14,
          paddingHorizontal: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        })}
      >
        <T px size={size} color={disabled ? COLORS.disabledInk : '#fff'} center>
          {label}
        </T>
      </Pressable>
    </Animated.View>
  );
};

export const BtnS: React.FC<{
  label?: string;
  sub?: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  size?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ label, sub, onPress, disabled, danger, size = 15, testID, style, children }) => {
  const pal = usePalette();
  const motion = usePress();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          backgroundColor: COLORS.paper,
          borderWidth: 4,
          borderColor: danger ? pal.bad : COLORS.ink,
          boxShadow: `0 ${pressed && motion ? 1 : 4}px 0 ${disabled ? COLORS.disabledLine : COLORS.ink}`,
          transform: [{ translateY: pressed && motion ? 3 : 0 }],
          minHeight: 48,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.55 : 1,
          marginBottom: 4,
        },
        style,
      ]}
    >
      {children ?? (
        <>
          <T x size={size} center color={danger ? pal.bad : COLORS.ink}>
            {label}
          </T>
          {sub ? (
            <T size={12} center>
              {sub}
            </T>
          ) : null}
        </>
      )}
    </Pressable>
  );
};

export const LinkBtn: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="link" style={{ paddingVertical: 10, paddingHorizontal: 6, minHeight: 44, justifyContent: 'center' }}>
    <T x size={14} style={{ textDecorationLine: 'underline' }}>
      {label}
    </T>
  </Pressable>
);

/** 44×44 outlined icon button with hand-drawn (View-built) glyphs. */
export const IconBtn: React.FC<{ icon: 'back' | 'close' | 'pause'; onPress: () => void; label: string }> = ({
  icon,
  onPress,
  label,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={{
      width: 44,
      height: 44,
      borderWidth: 3,
      borderColor: COLORS.ink,
      backgroundColor: COLORS.paper,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {icon === 'back' ? (
      <View
        style={{
          width: 13,
          height: 13,
          borderLeftWidth: 3,
          borderBottomWidth: 3,
          borderColor: COLORS.ink,
          transform: [{ translateX: 3 }, { rotate: '45deg' }],
        }}
      />
    ) : icon === 'close' ? (
      <View style={{ width: 18, height: 18 }}>
        {[45, -45].map((r) => (
          <View
            key={r}
            style={{ position: 'absolute', left: -1, top: 7.5, width: 20, height: 3, backgroundColor: COLORS.ink, transform: [{ rotate: `${r}deg` }] }}
          />
        ))}
      </View>
    ) : (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ width: 4, height: 14, backgroundColor: COLORS.ink }} />
        <View style={{ width: 4, height: 14, backgroundColor: COLORS.ink }} />
      </View>
    )}
  </Pressable>
);

// ───────────────────────────── Pixel images

export const Pix: React.FC<{ uri: string | undefined; size: number; h?: number; style?: StyleProp<ImageStyle>; label?: string }> = ({
  uri,
  size,
  h,
  style,
  label,
}) => (
  <Image
    source={{ uri }}
    style={[{ width: size, height: h ?? size }, PIX, style]}
    resizeMode="stretch"
    accessibilityLabel={label}
    accessible={!!label}
  />
);

export const portraitUri = (stem: string, mood: 'happy' | 'neutral' | 'wince' = 'neutral'): string =>
  IMAGES[`${stem}-${mood}`] ?? IMAGES[`${stem}-neutral`] ?? IMAGES['grandma-neutral'];

/** Portrait with an optional item overlay drawn on top. */
export const Avatar: React.FC<{
  stem: string;
  size: number;
  mood?: 'happy' | 'neutral' | 'wince';
  item?: string | null;
  grey?: boolean;
  label?: string;
}> = ({ stem, size, mood, item, grey, label }) => (
  <View style={{ width: size, height: size, opacity: grey ? 0.7 : 1, filter: grey ? 'grayscale(1)' : undefined } as ViewStyle}>
    <Pix uri={portraitUri(stem, mood)} size={size} label={label} />
    {item && OVERLAYS[item] ? <Pix uri={OVERLAYS[item]} size={size} style={{ position: 'absolute', left: 0, top: 0 }} /> : null}
  </View>
);

/** Wood picture frame (4px wood + 3px ink ring) around a portrait. */
export const Frame: React.FC<{
  stem?: string;
  size: number;
  mood?: 'happy' | 'neutral' | 'wince';
  item?: string | null;
  grey?: boolean;
  label?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ stem, size, mood, item, grey, label, children, style }) => (
  <View
    style={[
      {
        width: size,
        height: size,
        margin: 7,
        backgroundColor: COLORS.wood,
        boxShadow: `0 0 0 4px ${COLORS.woodDark}, 0 0 0 7px ${COLORS.ink}`,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style,
    ]}
  >
    {stem ? <Avatar stem={stem} size={size} mood={mood} item={item} grey={grey} label={label} /> : children}
  </View>
);

export const Coin: React.FC<{ size?: number }> = ({ size = 18 }) => <Pix uri={IMAGES.coin} size={size} />;

export const SuitImg: React.FC<{ suit: Card['suit']; size?: number }> = ({ suit, size = 16 }) => (
  <Pix uri={IMAGES[`s-${suit}`]} size={size} label={SUIT_NAME[suit]} />
);

/** Small quirk/item icon, e.g. 'i-glasses'. */
export const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 16 }) => <Pix uri={IMAGES[name]} size={size} />;

// ───────────────────────────── Bits

export const Bar: React.FC<{ pct: number; kind?: 'xp' | 'trust' | 'them'; height?: number; label?: string; style?: StyleProp<ViewStyle> }> = ({
  pct,
  kind = 'xp',
  height = 12,
  label,
  style,
}) => {
  const pal = usePalette();
  const fill = kind === 'xp' ? COLORS.ink : kind === 'trust' ? pal.ok : pal.tomato;
  return (
    <View
      accessibilityLabel={label}
      style={[{ height, borderWidth: 3, borderColor: COLORS.ink, backgroundColor: COLORS.paper, borderRadius: 6, overflow: 'hidden' }, style]}
    >
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: fill }} />
    </View>
  );
};

export const Pill: React.FC<{ label: string; open?: boolean; style?: StyleProp<ViewStyle> }> = ({ label, open, style }) => (
  <View
    style={[
      {
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderWidth: 3,
        borderColor: COLORS.ink,
        backgroundColor: open ? COLORS.sun : COLORS.paper,
        borderRadius: 20,
        alignSelf: 'flex-start',
      },
      style,
    ]}
  >
    <T x fixed size={12} numberOfLines={1}>
      {label}
    </T>
  </View>
);

/** Yellow callout box. */
export const Note: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <View style={[{ backgroundColor: COLORS.note, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 }, style]}>
    {typeof children === 'string' ? (
      <T x size={13}>
        {children}
      </T>
    ) : (
      children
    )}
  </View>
);

/** Paper panel with ink outline. */
export const Panel: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; picked?: boolean; grey?: boolean }> = ({
  children,
  style,
  picked,
  grey,
}) => {
  const pal = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.paper,
          borderWidth: 4,
          borderColor: COLORS.ink,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: picked ? `0 0 0 4px ${pal.tomato}` : undefined,
        },
        grey ? ({ filter: 'grayscale(1)', opacity: 0.7 } as ViewStyle) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

/** Row divider used in lists. */
export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[{ height: 2, backgroundColor: COLORS.line }, style]} />
);

/** ●●●◆○ stat dots; ◆ = boost from an item. */
export const statDots = (base: number, val: number): string => {
  let s = '';
  for (let k = 0; k < 5; k++) s += k < base ? '●' : k < val ? '◆' : '○';
  return s;
};

/** Promise/won dots, e.g. ●●○ (won 2 of 3). */
export const promiseDots = (promised: number | null, won: number): string => {
  const n = Math.max(promised ?? 0, won);
  let s = '';
  for (let i = 0; i < n; i++) s += i < won ? '●' : '○';
  return s;
};

export const Toggle: React.FC<{ label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  label,
  sub,
  value,
  onChange,
  disabled,
}) => {
  const pal = usePalette();
  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 2, borderColor: COLORS.line, minHeight: 52, opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ flex: 1 }}>
        <T x size={15}>
          {label}
        </T>
        {sub ? <T size={12}>{sub}</T> : null}
      </View>
      <View
        style={{
          width: 56,
          height: 32,
          borderWidth: 3,
          borderColor: COLORS.ink,
          borderRadius: 18,
          backgroundColor: value ? pal.ok : COLORS.toggleOff,
          justifyContent: 'center',
          alignItems: value ? 'flex-start' : 'flex-end',
          paddingHorizontal: 7,
        }}
      >
        <T x size={11} color={value ? '#fff' : COLORS.ink}>
          {value ? 'On' : 'Off'}
        </T>
      </View>
    </Pressable>
  );
};

/** Bottom sheet over a dimmed scrim, kept inside the phone column. */
export const Sheet: React.FC<{
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  scrim?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ visible, onClose, children, scrim = true, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: scrim ? COLORS.scrim : 'transparent', alignItems: 'center', justifyContent: 'flex-end' }}>
        {onClose ? <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" /> : null}
        <View
          style={[
            {
              width: '100%',
              maxWidth: PHONE_W,
              maxHeight: '92%',
              backgroundColor: COLORS.paper,
              borderWidth: 4,
              borderBottomWidth: 0,
              borderColor: COLORS.ink,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: '0 -6px 0 rgba(29,42,68,0.18)',
            },
            style,
          ]}
        >
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 20 + insets.bottom, gap: 12 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const Toast: React.FC<{ text: string | null; bottom?: number }> = ({ text, bottom = 96 }) =>
  text ? (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', zIndex: 50 }}>
      <View style={{ backgroundColor: COLORS.ink, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 }}>
        <T x size={14} color="#fff">
          {text}
        </T>
      </View>
    </View>
  ) : null;

// ───────────────────────────── Cards

const CARD_SIZES = {
  sm: { w: 52, h: 74 },
  md: { w: 58, h: 84 },
  lg: { w: 72, h: 104 },
};

/** Pixel playing card: rank + suit index top-left, big suit bottom-right. */
export const PixelCard: React.FC<{
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  dim?: boolean;
  win?: boolean;
  fade?: boolean;
  raised?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ card, size = 'md', onPress, dim, win, fade, raised, disabled, style }) => {
  const pal = usePalette();
  const { w, h } = CARD_SIZES[size];
  const scale = size === 'lg' ? 1.25 : 1;
  const label = `${rankLabel(card.rank) === 'A' ? 'Ace' : rankLabel(card.rank) === 'K' ? 'King' : rankLabel(card.rank) === 'Q' ? 'Queen' : rankLabel(card.rank) === 'J' ? 'Jack' : card.rank} of ${SUIT_NAME[card.suit]}`;
  const body = (
    <View
      style={[
        {
          width: w,
          height: h,
          backgroundColor: COLORS.paper,
          borderWidth: 3,
          borderColor: COLORS.ink,
          borderRadius: 5,
          overflow: 'hidden',
          opacity: dim ? 0.4 : fade ? 0.6 : 1,
          boxShadow: win
            ? `0 0 0 4px ${COLORS.sun}, 0 3px 0 4px ${COLORS.ink}`
            : `0 3px 0 ${COLORS.ink}`,
          borderStyle: win && pal.cvm ? 'dashed' : 'solid',
          transform: [{ translateY: raised ? -10 : 0 }, { scale: win ? 1.06 : 1 }],
        },
        style,
      ]}
    >
      <View style={{ position: 'absolute', left: 3, top: 3, width: 20 * scale, alignItems: 'center', gap: 2 }}>
        <T px fixed size={11 * scale} color={isRed(card) ? COLORS.cardRed : COLORS.ink} style={{ letterSpacing: -1, lineHeight: 12 * scale }}>
          {rankLabel(card.rank)}
        </T>
        <SuitImg suit={card.suit} size={18 * scale} />
      </View>
      <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
        <SuitImg suit={card.suit} size={27 * scale} />
      </View>
    </View>
  );
  if (!onPress) return <View accessibilityLabel={label}>{body}</View>;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      {body}
    </Pressable>
  );
};

/** Little example card used in How to Play / peeks. */
export const MiniCard: React.FC<{ card: Card; win?: boolean; tiny?: boolean }> = ({ card, win, tiny }) => (
  <View
    style={{
      width: tiny ? 25 : 38,
      height: tiny ? 36 : 54,
      backgroundColor: COLORS.paper,
      borderWidth: tiny ? 2 : 3,
      borderColor: COLORS.ink,
      borderRadius: 5,
      boxShadow: win ? `0 0 0 4px ${COLORS.sun}, 0 3px 0 4px ${COLORS.ink}` : `0 ${tiny ? 2 : 3}px 0 ${COLORS.ink}`,
      alignItems: 'center',
      justifyContent: 'center',
      gap: tiny ? 1 : 3,
    }}
    accessibilityLabel={`${rankLabel(card.rank)} of ${SUIT_NAME[card.suit]}`}
  >
    <T px fixed size={tiny ? 8 : 10} color={isRed(card) ? COLORS.cardRed : COLORS.ink} style={{ letterSpacing: -1 }}>
      {rankLabel(card.rank)}
    </T>
    <SuitImg suit={card.suit} size={tiny ? 12 : 16} />
  </View>
);

/** Face-down card back: red/cream stripes. Shown fanned in threes. */
export const CardBacks: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ flexDirection: 'row', paddingLeft: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={{
          width: 16,
          height: 22,
          marginLeft: -8,
          borderWidth: 2,
          borderColor: COLORS.ink,
          borderRadius: 2,
          backgroundColor: '#fff4e2',
          overflow: 'hidden',
        }}
      >
        {[0, 1].map((r) => (
          <View key={r} style={{ height: 4, marginTop: r === 0 ? 0 : 4, backgroundColor: '#d9483b' }} />
        ))}
      </View>
    ))}
  </View>
);

// ───────────────────────────── Legacy kit (tutorial + older call sites)

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  inner: { width: '100%', maxWidth: PHONE_W, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  title: { fontFamily: FONT.px, fontSize: 16, lineHeight: 24, color: COLORS.ink },
  subtitle: { fontFamily: FONT.body, fontSize: 14, color: COLORS.ink, marginTop: 4 },
  sectionTitle: { fontFamily: FONT.px, fontSize: 11, lineHeight: 16, color: COLORS.ink, marginTop: 20, marginBottom: 8 },
  body: { fontFamily: FONT.body, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  card: { backgroundColor: COLORS.paper, borderRadius: 10, borderWidth: 4, borderColor: COLORS.ink, padding: 12 },
  small: { fontFamily: FONT.body, fontSize: 12, lineHeight: 16, color: COLORS.ink },
  pill: { backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontFamily: FONT.bodyX, color: COLORS.ink, fontSize: 12 },
});

export const Btn: React.FC<{ label: string; onPress: () => void; primary?: boolean; disabled?: boolean; testID?: string }> = ({
  label,
  onPress,
  primary,
  disabled,
  testID,
}) => (
  <View style={{ marginTop: 12 }}>
    {primary ? (
      <BtnP label={label.length > 18 ? label : label.toUpperCase()} size={label.length > 18 ? 11 : 13} onPress={onPress} disabled={disabled} testID={testID} />
    ) : (
      <BtnS label={label} onPress={onPress} disabled={disabled} testID={testID} />
    )}
  </View>
);

export const ToggleRow = Toggle;

export const Portrait: React.FC<{ stem: string; mood?: 'happy' | 'neutral' | 'wince'; size?: number; grey?: boolean; item?: string | null }> = ({
  stem,
  mood = 'neutral',
  size = 48,
  grey,
  item,
}) => <Avatar stem={stem} mood={mood} size={size} grey={grey} item={item} />;

/** App wordmark: the pixel spade beside the two-line pixel name. */
export const Wordmark: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Pix uri={IMAGES['s-S']} size={size} />
    <T px size={Math.round(size * 0.45)} accessibilityRole="header">
      {'BACKYARD\nSPADES'}
    </T>
  </View>
);

export const StatBars: React.FC<{ stats: Stats; base?: Stats; large?: boolean }> = ({ stats, base, large }) => (
  <View style={{ marginTop: 6 }}>
    {STAT_ORDER.map((key) => {
      const b = base ? base[key] : stats[key];
      return (
        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T size={large ? 13 : 11} style={{ flex: 1 }}>
            {STAT_LABELS[key]}
            {stats[key] > b ? ' ▲' : ''}
          </T>
          <T size={large ? 12 : 9} style={{ letterSpacing: 1 }} accessibilityLabel={`${stats[key]} of 5`}>
            {statDots(b, stats[key])}
          </T>
        </View>
      );
    })}
  </View>
);

export const PromiseDots: React.FC<{ promised: number; won: number; label?: string }> = ({ promised, won, label }) => (
  <View>
    {label ? (
      <T x size={12}>
        {label}
      </T>
    ) : null}
    <T x size={13}>
      Promised {promised} • Won {won}
    </T>
    <T size={14} style={{ letterSpacing: 2 }}>
      {promiseDots(promised, won)}
    </T>
  </View>
);

export const PlayingCard: React.FC<{
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  large?: boolean;
  dimmed?: boolean;
}> = ({ card, onPress, disabled, highlighted, large, dimmed }) => (
  <View style={{ margin: 3 }}>
    <PixelCard card={card} size={large ? 'lg' : 'sm'} onPress={onPress} disabled={disabled} win={highlighted} dim={dimmed} />
  </View>
);

export const CardBack: React.FC<{ small?: boolean }> = () => <CardBacks count={3} />;

export const PartnerBlurb: React.FC<{ partner: PartnerDef }> = ({ partner }) => (
  <View>
    <T size={13}>{partner.goodWith}</T>
    <T size={13} style={{ marginTop: 4 }}>
      {partner.watchOut}
    </T>
  </View>
);
