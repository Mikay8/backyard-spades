// Game-table pieces — design canvas "The Card Table" / prototype table.
// Shared by the real game and the interactive tutorial.
import React from 'react';
import { View } from 'react-native';
import { IMAGES } from '../assets/images';
import { COLORS } from '../constants/theme';
import { type Card, type Play } from '../engine/cards';
import { Scaled, useColumnWidth } from './Scaled';
import { Bar, CardBacks, Frame, IconBtn, PixelCard, Pix, T, promiseDots } from './ui';

export const TopBar: React.FC<{ us: number; them: number; deal: number; onPause?: () => void; onClose?: () => void }> = ({ us, them, deal, onPause, onClose }) => (
  <View style={{ height: 60, paddingHorizontal: 12, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    {onPause ? <IconBtn icon="pause" label="Pause" onPress={onPause} /> : onClose ? <IconBtn icon="close" label="Leave tutorial" onPress={onClose} /> : <View style={{ width: 44 }} />}
    <View style={{ flex: 1 }}>
      <T px size={11} center>
        YOU {us} • THEM {them}
      </T>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        <Bar pct={us / 5} height={10} style={{ flex: 1 }} label="You, toward 500" />
        <Bar pct={them / 5} kind="them" height={10} style={{ flex: 1 }} label="Them, toward 500" />
      </View>
    </View>
    <View style={{ width: 62, alignItems: 'flex-end' }}>
      <T px size={9}>
        DEAL {deal}
      </T>
      <T size={10}>to 500</T>
    </View>
  </View>
);

export interface SeatInfo {
  promise: string;
  won: number;
  dots: string;
  cards: number;
  thinking: boolean;
}

export const seatInfo = (promise: number | null, won: number, cards: number, thinking: boolean, hidden = false): SeatInfo => ({
  promise: hidden ? '?' : promise === null ? '—' : promise === 0 ? 'Zero' : String(promise),
  won,
  dots: hidden || promise === 0 ? '' : promiseDots(promise, won),
  cards,
  thinking,
});

export const PartnerRow: React.FC<{
  name: string;
  stem: string;
  mood: 'happy' | 'neutral' | 'wince';
  item?: string | null;
  info: SeatInfo;
  compact?: boolean;
}> = ({ name, stem, mood, item, info, compact }) => (
  <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center', height: compact ? 84 : 100 }}>
    <Frame stem={stem} size={compact ? 56 : 80} mood={mood} item={item} label={name} />
    <View style={{ width: 190 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <T x size={16}>
          {name}
        </T>
        {item ? <Pix uri={IMAGES[`i-${item}`]} size={20} label="Equipped item" /> : null}
      </View>
      <T size={13} style={{ marginTop: 2 }}>
        Promised {info.promise} • Won {info.won}
      </T>
      {compact ? null : (
        <T size={14} style={{ letterSpacing: 2, minHeight: 18 }}>
          {info.dots}
        </T>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CardBacks />
        <T size={12} style={{ marginLeft: 6 }}>
          {info.cards} cards
        </T>
        {info.thinking ? (
          <T x size={12} style={{ marginLeft: 6 }}>
            thinking…
          </T>
        ) : null}
      </View>
    </View>
  </View>
);

const OppSeat: React.FC<{ label: string; stem: string; info: SeatInfo; left: number }> = ({ label, stem, info, left }) => (
  <View style={{ position: 'absolute', left, top: 18 }}>
    <Frame stem={stem} size={80} label={`${label} neighbour`} />
    <View
      style={{
        marginTop: 10,
        marginHorizontal: 4,
        width: 80,
        backgroundColor: 'rgba(255,250,240,0.94)',
        borderWidth: 3,
        borderColor: COLORS.ink,
        borderRadius: 6,
        padding: 3,
      }}
    >
      <T size={11} center style={{ lineHeight: 14 }}>
        <T x size={11}>
          {label}
        </T>
        {`\nPromised ${info.promise}\nWon ${info.won}\n${info.cards} cards`}
        {info.thinking ? '\nthinking…' : ''}
      </T>
    </View>
  </View>
);

const SLOT_POS: Record<number, { left: number; top: number }> = {
  0: { left: 169, top: 140 },
  1: { left: 100, top: 88 },
  2: { left: 169, top: 38 },
  3: { left: 238, top: 88 },
};

/** The 390×252 backyard scene with both opponents and the cards in play. */
export const TableScene: React.FC<{
  left: SeatInfo;
  right: SeatInfo;
  plays: Play[];
  winnerSeat: number | null;
  maxH?: number;
  children?: React.ReactNode;
}> = ({ left, right, plays, winnerSeat, maxH, children }) => (
  <Scaled w={390} h={252} maxH={maxH}>
    <Pix uri={IMAGES.scene} size={390} h={252} label="Backyard picnic table" />
    <OppSeat label="Left" stem="p-nbrL" info={left} left={8} />
    <OppSeat label="Right" stem="p-nbrR" info={right} left={298} />
    {plays.map((p) => (
      <View key={`${p.seat}`} style={{ position: 'absolute', ...SLOT_POS[p.seat] }}>
        <PixelCard card={p.card} size="sm" win={winnerSeat === p.seat} fade={winnerSeat !== null && winnerSeat !== p.seat} />
      </View>
    ))}
    {children}
  </Scaled>
);

/** Your hand: one row up to 7 cards, otherwise two overlapping rows. */
export const Hand: React.FC<{
  cards: Card[];
  large?: boolean;
  isLegal: (c: Card) => boolean | null;
  pulse?: (c: Card) => boolean;
  onTap: (c: Card) => void;
  disabled?: boolean;
}> = ({ cards, large, isLegal, pulse, onTap, disabled }) => {
  const col = useColumnWidth();
  const cw = large ? 72 : 58;
  const ch = large ? 104 : 84;
  const n = cards.length;
  const cols = n <= 7 ? n : Math.ceil(n / 2);
  const avail = col - 32;
  const step = cols > 1 ? Math.min(52, Math.floor((avail - cw) / (cols - 1))) : 0;
  const rowW = cw + (cols - 1) * step;
  const x0 = Math.round((col - rowW) / 2);
  const rowH = large ? 70 : 58;
  const rows = n > cols ? 2 : 1;
  return (
    <View style={{ height: 6 + (rows - 1) * rowH + ch + 14, width: col, alignSelf: 'center' }}>
      {cards.map((c, i) => {
        const legal = isLegal(c);
        const row = Math.floor(i / Math.max(cols, 1));
        const ci = i % Math.max(cols, 1);
        return (
          <View key={`${c.suit}${c.rank}`} style={{ position: 'absolute', left: x0 + ci * step, top: 6 + row * rowH }}>
            <PixelCard
              card={c}
              size={large ? 'lg' : 'md'}
              dim={legal === false}
              raised={pulse?.(c) ?? false}
              win={pulse?.(c) ?? false}
              onPress={() => onTap(c)}
              disabled={disabled}
            />
          </View>
        );
      })}
    </View>
  );
};

export const YouPanel: React.FC<{ info: SeatInfo; roundsLeft: number; compact?: boolean }> = ({ info, roundsLeft, compact }) => (
  <View
    style={{
      marginHorizontal: 16,
      backgroundColor: COLORS.paper,
      borderWidth: 4,
      borderColor: COLORS.ink,
      borderRadius: 10,
      paddingVertical: compact ? 5 : 10,
      paddingHorizontal: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <View>
      <T x size={12}>
        YOU
      </T>
      <T px size={12}>
        Promised {info.promise} • Won {info.won}
      </T>
      <T size={compact ? 14 : 20} style={{ letterSpacing: 3, minHeight: compact ? 0 : 26 }}>
        {info.dots}
      </T>
    </View>
    <T size={13}>{roundsLeft} rounds left</T>
  </View>
);

export const Coach: React.FC<{ text: string; tut?: boolean; action?: React.ReactNode }> = ({ text, tut, action }) => (
  <View style={{ marginHorizontal: 12, minHeight: 64 }}>
    <View
      style={{
        backgroundColor: tut ? COLORS.note : COLORS.paper,
        borderWidth: 4,
        borderColor: COLORS.ink,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        minHeight: 56,
      }}
    >
      <T x size={15} style={{ flex: 1 }} accessibilityLiveRegion="polite">
        {text}
      </T>
      {action}
    </View>
  </View>
);
