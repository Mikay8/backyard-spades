// Family — brief §12.5. All 8 partners, buy the locked ones, favourite (Rank 10+).
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PartnerCard } from '../components/PartnerCard';
import { Btn, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Family() {
  const { profile, rank, buyPartner, setFavourite } = useApp();
  const [pendingBuy, setPendingBuy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const allOwned = PARTNERS.every((p) => profile.owned.includes(p.id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: COLORS.grass, fontWeight: '700' }}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Family</Text>
        <Text style={styles.subtitle}>
          Rank {rank} • ● {profile.coins} Coins
        </Text>
        {allOwned ? (
          <Text style={[styles.body, { marginTop: 8, fontWeight: '700', color: COLORS.grass }]}>
            The whole family is here.
          </Text>
        ) : null}

        {PARTNERS.map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            owned={profile.owned.includes(p.id)}
            rank={rank}
            coins={profile.coins}
            favourite={profile.favourite === p.id}
            gamesPlayed={profile.gamesWithPartner[p.id]?.played}
            gamesWon={profile.gamesWithPartner[p.id]?.won}
            onBuy={() => setPendingBuy(p.id)}
            onFavourite={() => setFavourite(p.id)}
            showBuy
          />
        ))}

        {pendingBuy ? (
          <View style={[styles.card, { marginTop: 12, borderColor: COLORS.accent, borderWidth: 2 }]}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink }}>
              Buy {partnerById(pendingBuy).name} for {partnerById(pendingBuy).price} Coins?
            </Text>
            <Text style={styles.body}>You have {profile.coins} Coins.</Text>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Btn label="Cancel" onPress={() => setPendingBuy(null)} />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Btn
                  label="Buy"
                  primary
                  onPress={() => {
                    if (buyPartner(pendingBuy)) {
                      setToast(`${partnerById(pendingBuy).name} joined the family.`);
                    } else {
                      setToast('Not enough Coins yet — play more games to earn Coins.');
                    }
                    setPendingBuy(null);
                  }}
                />
              </View>
            </View>
          </View>
        ) : null}
        {toast ? (
          <Text style={[styles.body, { marginTop: 10, color: COLORS.grass, fontWeight: '700' }]}>{toast}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
