// Pick Your Partner — brief §12.2. Grandma Rose pre-selected for first-timers.
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PartnerCard } from '../components/PartnerCard';
import { Btn, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Pick() {
  const { profile, rank, buyPartner, startGame } = useApp();
  const params = useLocalSearchParams<{ partner?: string }>();
  const [selected, setSelected] = useState<string>(
    params.partner && profile.owned.includes(params.partner) ? params.partner : 'grandma',
  );
  const [pendingBuy, setPendingBuy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const chosen = partnerById(selected);

  const confirmBuy = (id: string) => {
    if (buyPartner(id)) {
      setToast(`${partnerById(id).name} joined the family.`);
      setSelected(id);
      setPendingBuy(null);
    } else {
      setToast('Not enough Coins yet — play more games to earn Coins.');
      setPendingBuy(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: COLORS.grass, fontWeight: '700' }}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Pick your partner</Text>
        <Text style={styles.subtitle}>Who&rsquo;s sitting across from you?</Text>
        <Text style={[styles.small, { marginTop: 6 }]}>
          Rank {rank} • ● {profile.coins} Coins
        </Text>

        {PARTNERS.map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            owned={profile.owned.includes(p.id)}
            rank={rank}
            coins={profile.coins}
            selected={selected === p.id && profile.owned.includes(p.id)}
            favourite={profile.favourite === p.id}
            gamesPlayed={profile.gamesWithPartner[p.id]?.played}
            gamesWon={profile.gamesWithPartner[p.id]?.won}
            onPick={() => setSelected(p.id)}
            onBuy={() => setPendingBuy(p.id)}
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
                <Btn label="Buy" primary onPress={() => confirmBuy(pendingBuy)} />
              </View>
            </View>
          </View>
        ) : null}

        {toast ? (
          <Text style={[styles.body, { marginTop: 10, color: COLORS.grass, fontWeight: '700' }]}>{toast}</Text>
        ) : null}

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink }}>
            {chosen.name} — {chosen.role}
          </Text>
          <Text style={styles.body}>{chosen.quirk}</Text>
        </View>
        <Btn
          label={`Start Game with ${chosen.name.split(' ')[0]}`}
          primary
          disabled={!profile.owned.includes(selected)}
          onPress={() => {
            startGame(selected);
            router.push('/game');
          }}
          testID="start-game"
        />
      </View>
    </ScrollView>
  );
}
