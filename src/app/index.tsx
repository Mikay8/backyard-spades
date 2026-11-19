// Home — design canvas "Home". Wordmark, rank + Coins, backyard scene with
// your partner framed at the table, PLAY, tutorial, links, family strip,
// last-game card. No accounts, no sign-in.
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { IMAGES } from '../assets/images';
import { RankSheet, rankLine } from '../components/sheets';
import { Bar, BtnP, BtnS, Coin, Frame, LinkBtn, Pix, Screen, T, Wordmark } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS, partnerById, xpIntoRank } from '../constants/partners';
import { useApp } from '../state/store';

export default function Home() {
  const { profile, rank, lastResult } = useApp();
  const [showRank, setShowRank] = useState(false);
  const firstRun = profile.gamesPlayed === 0;
  const last = profile.lastGame;
  const picked = partnerById(profile.picked);

  return (
    <Screen contentStyle={{ paddingTop: 22, gap: 10 }} overlay={<RankSheet visible={showRank} onClose={() => setShowRank(false)} />}>
      <Wordmark size={36} />
      {firstRun && !last ? <T size={14}>Pick a partner from the family. Promise rounds. Win the game.</T> : null}

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
        <Pressable
          onPress={() => setShowRank(true)}
          accessibilityRole="button"
          accessibilityLabel="Rank details"
          style={{ flex: 1, backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, minHeight: 52 }}
        >
          <T x size={13}>
            {rankLine(rank, profile.xp)}
          </T>
          <Bar pct={xpIntoRank(profile.xp)} style={{ marginTop: 6 }} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/family')}
          accessibilityRole="button"
          accessibilityLabel={`${profile.coins} Coins, open the family`}
          style={{ width: 124, backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Coin />
          <T x size={14}>
            {profile.coins} Coins
          </T>
        </Pressable>
      </View>

      {/* Backyard scene, partner framed at the table */}
      <View style={{ marginHorizontal: -16, height: 142, overflow: 'hidden', borderTopWidth: 4, borderBottomWidth: 4, borderColor: COLORS.ink, alignItems: 'center' }}>
        <Pix uri={IMAGES.scene} size={432} h={279} style={{ position: 'absolute', top: -64 }} label="Backyard picnic table with string lights" />
        <View style={{ marginTop: 23 }}>
          <Frame stem={picked.portrait} size={80} item={profile.equip[picked.id]} label={`Your partner, ${picked.name}`} />
        </View>
      </View>

      <BtnP label="PLAY" onPress={() => router.push('/pick')} pulse={firstRun} testID="play-button" style={{ marginTop: 6 }} />
      <BtnS label="Interactive Tutorial" sub="Learn by playing — 5 minutes" onPress={() => router.push('/tutorial')} testID="tutorial-button" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', columnGap: 4 }}>
        <LinkBtn label="How to Play" onPress={() => router.push('/howto')} />
        <T aria-hidden>•</T>
        <LinkBtn label="Family" onPress={() => router.push('/family')} />
        <T aria-hidden>•</T>
        <LinkBtn label="Shed" onPress={() => router.push('/shed')} />
        <T aria-hidden>•</T>
        <LinkBtn label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View>
        <T x size={13} style={{ marginBottom: 6 }}>
          Your family
        </T>
        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          {PARTNERS.map((p) => {
            const owned = profile.owned.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push({ pathname: '/partner', params: { id: p.id } })}
                accessibilityRole="button"
                accessibilityLabel={p.name}
                style={{ width: 40, alignItems: 'center' }}
              >
                <Pix uri={IMAGES[`${p.portrait}-neutral`]} size={40} style={owned ? undefined : ({ filter: 'grayscale(1)', opacity: 0.7 } as object)} />
                {!owned ? (
                  <T x size={10}>
                    R{p.unlockRank}
                  </T>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {last && lastResult ? (
        <Pressable
          onPress={() => router.push('/result')}
          accessibilityRole="button"
          style={{ backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }}
        >
          <T size={13}>
            Last game: {last.won ? 'Won' : 'Lost'} with {partnerById(last.partnerId).name} — {last.finalUs} to {last.finalThem} — +{last.coinsEarned} Coins
          </T>
        </Pressable>
      ) : null}
    </Screen>
  );
}
