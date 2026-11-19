// Promise picker — brief §12.3.2. Numbers 0–13; 0 is "Go zero".
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { likelyWinnersHint } from '../engine/ai';
import { type Card } from '../engine/cards';
import { Btn, styles } from './ui';

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
}> = ({ hand, partnerPromise, partnerName, seePartnerPromise, opponentPromises, onConfirm, suggested, onWrongTap }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const likely = likelyWinnersHint(hand);
  const hintFor = (n: number): string => {
    if (n === 0) return 'Go zero is +100 if you win none, -100 if you win even one.';
    if (n === likely) return `${n} is a good promise with this hand.`;
    if (n < likely) return `${n} is safe with this hand — you have about ${likely} likely winners.`;
    return `${n} is bold — you have about ${likely} likely winners.`;
  };
  const teamTotal = (picked ?? 0) + (seePartnerPromise && partnerPromise !== null ? partnerPromise : 0);
  return (
    <View style={[styles.card, { marginTop: 12 }]}>
      <Text style={{ fontSize: 19, fontWeight: '800', color: COLORS.ink }}>How many rounds will you win?</Text>
      <Text style={styles.small}>Count the cards you think will win. Spades beat everything.</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
        {Array.from({ length: 14 }).map((_, n) => (
          <Pressable
            key={n}
            onPress={() => {
              if (suggested !== undefined && n !== suggested) {
                onWrongTap?.(n);
                return;
              }
              setPicked(n);
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              margin: 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: picked === n ? COLORS.accent : n === 0 ? '#F5E6D3' : COLORS.cream,
              borderWidth: picked === n ? 0 : 2,
              borderColor: n === suggested ? COLORS.accent : COLORS.line,
            }}
            accessibilityRole="button"
            accessibilityLabel={n === 0 ? 'Go zero — win zero rounds' : `Promise ${n} rounds`}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: picked === n ? '#fff' : COLORS.ink }}>
              {n}
            </Text>
            {n === 0 ? <Text style={{ fontSize: 9, color: picked === n ? '#fff' : COLORS.inkSoft }}>GO ZERO</Text> : null}
          </Pressable>
        ))}
      </View>

      {picked !== null ? (
        <Text style={[styles.body, { marginTop: 8 }]}>{hintFor(picked)}</Text>
      ) : (
        <Text style={[styles.body, { marginTop: 8 }]}>You have about {likely} likely winners in this hand.</Text>
      )}

      <View style={{ marginTop: 10 }}>
        <Text style={styles.body}>
          {seePartnerPromise && partnerPromise !== null
            ? `${partnerName} promised ${partnerPromise}.`
            : `${partnerName} will promise after you.`}
        </Text>
        {opponentPromises.map((o) => (
          <Text key={o.name} style={styles.body}>
            {o.name} promised {o.promise}.
          </Text>
        ))}
        {picked !== null && seePartnerPromise ? (
          <Text style={[styles.body, { fontWeight: '800', marginTop: 4 }]}>
            Together you promised {teamTotal}.
          </Text>
        ) : null}
      </View>

      <Btn
        label={picked === null ? 'Pick a number first' : picked === 0 ? 'Go zero' : `Promise ${picked}`}
        primary
        disabled={picked === null}
        onPress={() => picked !== null && onConfirm(picked)}
        testID="confirm-promise"
      />
      <Text style={[styles.small, { marginTop: 6 }]}>
        You can&rsquo;t change your promise after you confirm it.
      </Text>
      <Text style={[styles.small, { marginTop: 2 }]}>Aces and high spades usually win a round.</Text>
    </View>
  );
};
