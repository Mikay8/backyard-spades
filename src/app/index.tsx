// Home — brief §12.1. Play / Tutorial / Family / Settings, rank + Coins,
// family strip, last-game card. No accounts, no sign-in.
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, type ImageStyle } from 'react-native';
import { IMAGES } from '../assets/images';
import { Btn, Portrait, styles, Wordmark } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS, RANK_ADVANTAGES, nextUnlockAfter, xpToNextRank } from '../constants/partners';
import { useApp } from '../state/store';

export default function Home() {
  const { profile, rank, lastResult } = useApp();
  const [showRank, setShowRank] = useState(false);
  const next = nextUnlockAfter(rank);
  const isNew = profile.gamesPlayed === 0;
  const last = profile.lastGame;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <Wordmark />
        <Image
          source={{ uri: IMAGES.scene }}
          style={{
            width: '100%',
            height: 84,
            marginTop: 12,
            borderRadius: 12,
            imageRendering: 'pixelated',
          } as ImageStyle}
          resizeMode="cover"
        />
        {isNew ? (
          <Text style={[styles.subtitle, { marginTop: 10 }]}>
            Pick a partner from the family. Promise rounds. Win the game.
          </Text>
        ) : null}

        <Pressable onPress={() => setShowRank((v) => !v)} style={[styles.card, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>Rank {rank}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink }}>● {profile.coins} Coins</Text>
          </View>
          <View style={{ height: 10, backgroundColor: '#EDE6D2', borderRadius: 5, marginTop: 8 }}>
            <View
              style={{
                height: 10,
                width: `${((100 - xpToNextRank(profile.xp)) / 100) * 100}%`,
                backgroundColor: COLORS.grass,
                borderRadius: 5,
              }}
            />
          </View>
          <Text style={styles.small}>{xpToNextRank(profile.xp)} XP to Rank {rank + 1}</Text>
          {next ? (
            <Text style={[styles.small, { marginTop: 4 }]}>
              Next: {next.name} — Rank {next.unlockRank} • {next.price} Coins
            </Text>
          ) : (
            <Text style={[styles.small, { marginTop: 4 }]}>The whole family is here.</Text>
          )}
        </Pressable>

        {showRank ? (
          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink }}>Your rank</Text>
            <Text style={styles.body}>
              Games played {profile.gamesPlayed} • Won {profile.wins}
            </Text>
            <Text style={[styles.body, { marginTop: 6 }]}>What rank unlocks:</Text>
            {RANK_ADVANTAGES.map((a) => (
              <Text key={a.rank} style={styles.body}>
                Rank {a.rank} — {a.label}
              </Text>
            ))}
          </View>
        ) : null}

        <Btn label="PLAY" primary onPress={() => router.push('/pick')} testID="play-button" />
        <Btn
          label="Interactive Tutorial — learn by playing, 5 minutes"
          onPress={() => router.push('/tutorial')}
          testID="tutorial-button"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
          <Pressable onPress={() => router.push('/howto')}>
            <Text style={{ color: COLORS.grass, fontWeight: '700' }}>How to Play</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/family')}>
            <Text style={{ color: COLORS.grass, fontWeight: '700' }}>Family</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={{ color: COLORS.grass, fontWeight: '700' }}>Settings</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Your family</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          {PARTNERS.map((p) => {
            const owned = profile.owned.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push('/family')}
                style={{ alignItems: 'center', marginRight: 14, width: 64 }}
              >
                <Portrait stem={p.portrait} size={56} grey={!owned} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.ink, textAlign: 'center' }}>
                  {p.name.split(' ')[0]}
                </Text>
                {!owned ? (
                  <Text style={{ fontSize: 10, color: COLORS.inkSoft }}>Rank {p.unlockRank}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {last && lastResult ? (
          <Pressable onPress={() => router.push('/result')} style={[styles.card, { marginTop: 20 }]}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.ink }}>Last game</Text>
            <Text style={styles.body}>
              {last.won ? 'Won' : 'Lost'} with {PARTNERS.find((p) => p.id === last.partnerId)?.name} —{' '}
              {last.finalUs} to {last.finalThem} — +{last.coinsEarned} Coins
            </Text>
            <Text style={styles.small}>Tap to see the result again.</Text>
          </Pressable>
        ) : null}

        <Text style={[styles.small, { marginTop: 24, textAlign: 'center' }]}>
          Backyard Spades is a points-based family card game. No real-money gambling, no prizes, no
          in-app purchases of currency.
        </Text>
      </View>
    </ScrollView>
  );
}
