// Promise picker — design canvas floating promise sheet. 1–13 grid, a
// dashed "Go zero" bar, live help for the tapped number, team total.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { likelyWinnersHint } from '../engine/ai';
import { type Card } from '../engine/cards';
import { BtnP, T, usePalette } from './ui';

const Num: React.FC<{ n: number; on: boolean; onPress: () => void; hint?: boolean }> = ({ n, on, onPress, hint }) => {
  const pal = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Promise ${n} rounds`}
      accessibilityState={{ selected: on }}
      style={{
        width: 42,
        height: 42,
        borderWidth: 3,
        borderColor: hint && !on ? pal.tomato : COLORS.ink,
        backgroundColor: on ? pal.tomato : COLORS.paper,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: on ? 'none' : `0 3px 0 ${COLORS.ink}`,
        transform: [{ translateY: on ? 3 : 0 }],
      }}
    >
      <T px size={12} color={on ? '#fff' : COLORS.ink}>
        {n}
      </T>
    </Pressable>
  );
};

export const PromisePicker: React.FC<{
  hand: Card[];
  partnerPromise: number | null;
  partnerName: string;
  seePartnerPromise: boolean;
  opponentPromises: { name: string; promise: number }[];
  onConfirm: (n: number) => void;
  /** Tutorial mode: only `suggested` is the right answer; other taps show hints. */
  suggested?: number;
  onWrongTap?: (n: number) => void;
  /** Tutorial coaching line shown in place of the computed help. */
  helpOverride?: string;
}> = ({ hand, partnerPromise, partnerName, seePartnerPromise, opponentPromises, onConfirm, suggested, onWrongTap, helpOverride }) => {
  const pal = usePalette();
  const [picked, setPicked] = useState<number | null>(null);
  const likely = likelyWinnersHint(hand);
  const tap = (n: number) => {
    if (suggested !== undefined && n !== suggested) {
      onWrongTap?.(n);
      return;
    }
    setPicked(n);
  };
  const help =
    helpOverride ??
    (picked === null
      ? 'Tap a number to see how it looks with your hand.'
      : picked === 0
        ? 'Go zero is +100 if you win none, -100 if you win even one.'
        : picked <= likely
          ? `${picked} is safe with this hand.`
          : `${picked} is bold — you have about ${likely} likely winners.`);
  const otherSide = opponentPromises.reduce((s, o) => s + o.promise, 0);
  const partnerKnown = seePartnerPromise && partnerPromise !== null;
  const team = picked !== null && partnerKnown ? picked + (partnerPromise ?? 0) : null;

  return (
    <View
      style={{
        backgroundColor: COLORS.paper,
        borderWidth: 4,
        borderColor: COLORS.ink,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        boxShadow: '0 -6px 0 rgba(29,42,68,0.18)',
        gap: 6,
      }}
    >
      <T x size={18} accessibilityRole="header">
        How many rounds will you win?
      </T>
      <T size={12}>
        {partnerKnown ? `${partnerName} promised ${partnerPromise}` : `${partnerName} will promise after you`}
        {'\n'}The other side promised {otherSide} together
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <Num key={i + 1} n={i + 1} on={picked === i + 1} hint={suggested === i + 1} onPress={() => tap(i + 1)} />
        ))}
      </View>
      <Pressable
        onPress={() => tap(0)}
        accessibilityRole="button"
        accessibilityLabel="Go zero — win zero rounds"
        accessibilityState={{ selected: picked === 0 }}
        style={{
          height: 40,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderColor: COLORS.ink,
          borderRadius: 6,
          backgroundColor: picked === 0 ? pal.tomato : COLORS.paper,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <T x size={14} color={picked === 0 ? '#fff' : COLORS.ink}>
          Go zero — win zero rounds
        </T>
      </Pressable>
      <T x size={13} style={{ minHeight: 34 }}>
        {help}
      </T>
      {team !== null ? <T size={13}>Together you promised {team}</T> : null}
      <BtnP
        label={picked === null ? 'Pick a number' : picked === 0 ? 'Go zero' : `Promise ${picked}`}
        size={13}
        disabled={picked === null}
        onPress={() => picked !== null && onConfirm(picked)}
        testID="confirm-promise"
      />
    </View>
  );
};
