// Game Result — brief §12.4. Scorecard, partner review, Coins + XP + rank,
// Play Again / Back to Home / Share Result (fixed share text, §12.4.1).
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Btn, Portrait, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Result() {
  const { result, lastResult, buyPartner, profile } = useApp();
  const [copied, setCopied] = useState(false);
  const [bought, setBought] = useState<string | null>(null);
  const res = result ?? lastResult;
  const readOnly = result === null;

  if (!res) {
    return (
      <View style={[styles.screen, { justifyContent: 'center' }]}>
        <Text style={styles.body}>No game result to show yet.</Text>
        <Btn label="Back to Home" primary onPress={() => router.replace('/')} />
      </View>
    );
  }

  const partner = partnerById(res.partnerId);
  const lastDeal = res.deals[res.deals.length - 1];
  const shareText = [
    `Backyard Spades — with ${partner.name}`,
    res.won ? `Won ${res.finalUs} to ${res.finalThem}` : `Lost ${res.finalUs} to ${res.finalThem}`,
    lastDeal ? `Promised ${lastDeal.usPromise}, won ${lastDeal.usWon} in the last deal` : '',
    'Beat our score?',
  ]
    .filter(Boolean)
    .join('\n');
  const rankedUp = res.rankAfter > res.rankBefore;

  const copyShare = async () => {
    try {
      const nav = (globalThis as unknown as { navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } } }).navigator;
      if (nav?.clipboard) {
        await nav.clipboard.writeText(shareText);
        setCopied(true);
        return;
      }
    } catch {
      // Fall through to showing the text below.
    }
    setCopied(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Portrait stem={partner.portrait} size={72} mood={res.won ? 'happy' : 'wince'} />
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.ink, marginTop: 8, textAlign: 'center' }}>
            {res.won ? 'You won the game' : 'They won the game'}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink }}>
            {res.finalUs} to {res.finalThem}
          </Text>
          <Text style={styles.subtitle}>with {partner.name}</Text>
        </View>

        {rankedUp ? (
          <View style={[styles.card, { marginTop: 14, borderColor: COLORS.accent, borderWidth: 2 }]}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.accent }}>
              Rank {res.rankAfter} reached!
            </Text>
            {res.newlyBuyable.length > 0 ? (
              <Text style={styles.body}>
                {res.newlyBuyable.map((p) => p.name).join(', ')} {res.newlyBuyable.length === 1 ? 'is' : 'are'} ready to buy!
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Each deal</Text>
        {res.deals.map((d) => (
          <View key={d.deal} style={[styles.card, { marginTop: 8 }]}>
            <Text style={{ fontWeight: '800', color: COLORS.ink }}>Deal {d.deal}</Text>
            <Text style={styles.body}>
              You promised {d.usPromise}, won {d.usWon} — {d.usPoints >= 0 ? '+' : ''}
              {d.usPoints}
            </Text>
            <Text style={styles.body}>
              They promised {d.themPromise}, won {d.themWon} — {d.themPoints >= 0 ? '+' : ''}
              {d.themPoints}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Partner review</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={styles.body}>{res.partnerReview}</Text>
          {res.partnerReview2 ? <Text style={[styles.body, { marginTop: 4 }]}>{res.partnerReview2}</Text> : null}
          {!res.won && lastDeal ? (
            <Text style={[styles.body, { marginTop: 4 }]}>
              Close — you missed your promise by {Math.max(0, lastDeal.usPromise - lastDeal.usWon)} round
              {lastDeal.usPromise - lastDeal.usWon === 1 ? '' : 's'} in Deal {lastDeal.deal}.
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>+{res.coinsEarned} Coins</Text>
          <Text style={styles.body}>+{res.xpEarned} XP — Rank {res.rankBefore} → Rank {res.rankAfter}</Text>
          {res.playerWentZeroClean ? (
            <Text style={styles.body}>Includes the go-zero win bonus (+50 XP, +10 Coins).</Text>
          ) : null}
        </View>

        {!readOnly && res.newlyBuyable.length > 0 ? (
          <View style={{ marginTop: 14 }}>
            {res.newlyBuyable.map((p) => (
              <View key={p.id} style={[styles.card, { marginTop: 8 }]}>
                <Text style={{ fontWeight: '800', color: COLORS.ink }}>
                  {p.name} — Rank {p.unlockRank} • {p.price} Coins
                </Text>
                {bought === p.id ? (
                  <Text style={[styles.body, { color: COLORS.grass, fontWeight: '700' }]}>{p.name} joined the family.</Text>
                ) : (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Btn label="Later" onPress={() => setBought(`later-${p.id}`)} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Btn
                        label={`Buy — ${p.price} Coins`}
                        primary
                        disabled={profile.coins < p.price}
                        onPress={() => {
                          if (buyPartner(p.id)) setBought(p.id);
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {!readOnly ? (
          <Btn
            label="Play Again"
            primary
            onPress={() => router.push({ pathname: '/pick', params: { partner: res.partnerId } })}
            testID="play-again"
          />
        ) : null}
        <Btn label="Back to Home" onPress={() => router.replace('/')} />
        <Btn label={copied ? 'Copied — paste it anywhere' : 'Share Result'} onPress={() => void copyShare()} />
        <Pressable onPress={() => void copyShare()}>
          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={styles.small}>Share text:</Text>
            <Text style={styles.body}>{shareText}</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
