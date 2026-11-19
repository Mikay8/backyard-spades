// Partner detail — design canvas "PARTNER". Big framed portrait, quirk,
// stats with plain-language lines, games together, Pick / Buy.
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { IMAGES } from '../assets/images';
import { ItemChips, partnerButtonLabel } from '../components/PartnerCard';
import { BuySheet } from '../components/sheets';
import { BtnP, Divider, Frame, Header, Note, Pix, Screen, T, statDots } from '../components/ui';
import { effectiveStats, itemById } from '../constants/items';
import { PARTNER_ACCENT, STAT_LABELS, STAT_ORDER, STAT_TEXT, partnerById, stripLead } from '../constants/partners';
import { useApp } from '../state/store';

export default function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile, rank, setPicked } = useApp();
  const [buyId, setBuyId] = useState<string | null>(null);
  const p = partnerById(id ?? 'grandma');
  const owned = profile.owned.includes(p.id);
  const itemId = profile.equip[p.id] ?? null;
  const item = itemById(itemId);
  const stats = effectiveStats(p, item);
  const can = rank >= p.unlockRank;
  const enough = profile.coins >= p.price;
  const games = profile.gamesWithPartner[p.id] ?? { played: 0, won: 0 };
  const note = owned
    ? ''
    : can
      ? enough
        ? ''
        : `You have ${profile.coins} Coins — you need ${p.price}. Play more games to earn Coins.`
      : `Play more games to reach Rank ${p.unlockRank}.`;
  const label = partnerButtonLabel(p, owned, profile.picked === p.id, rank, profile.coins);

  return (
    <Screen
      header={<Header title="PARTNER" titleSize={12} onBack={() => router.back()} />}
      contentStyle={{ paddingTop: 8 }}
      footer={
        owned ? (
          <BtnP
            label={label.toUpperCase()}
            onPress={() => {
              setPicked(p.id);
              router.back();
            }}
          />
        ) : (
          <BtnP label={label.toUpperCase()} size={12} disabled={!(can && enough)} onPress={() => setBuyId(p.id)} />
        )
      }
      overlay={<BuySheet partnerId={buyId} onClose={() => setBuyId(null)} onBought={(bid) => setPicked(bid)} />}
    >
      <View style={{ height: 8, backgroundColor: PARTNER_ACCENT[p.id] }} />
      <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 16 }}>
        <Frame stem={p.portrait} size={160} item={itemId} grey={!owned} label={`${p.name} portrait`} />
      </View>
      {owned ? <ItemChips partnerId={p.id} big /> : null}
      <T x size={24} accessibilityRole="header">
        {p.name}
      </T>
      <T size={14} style={{ opacity: 0.85 }}>
        {p.role}
      </T>
      <T size={20} style={{ marginTop: 10, marginBottom: 14, lineHeight: 25 }}>
        {p.quirk}
      </T>
      {item ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <Pix uri={IMAGES[`i-${item.id}`]} size={28} />
          <T x size={14}>
            {item.name} equipped — ◆ marks the boost
          </T>
        </View>
      ) : null}
      {STAT_ORDER.map((k) => (
        <View key={k}>
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <T x size={13}>
                {STAT_LABELS[k]}
                {stats[k] > p.stats[k] ? ' ▲' : ''}
              </T>
              <T size={12} style={{ opacity: 0.85 }}>
                {STAT_TEXT[k][stats[k] - 1]}
              </T>
            </View>
            <T size={12} style={{ letterSpacing: 1 }} accessibilityLabel={`${stats[k]} of 5`}>
              {statDots(p.stats[k], stats[k])}
            </T>
          </View>
        </View>
      ))}
      <T size={13} style={{ marginTop: 12 }}>
        <T x size={13}>Good with you if… </T>
        {stripLead(p.goodWith)}
      </T>
      <T size={13} style={{ marginTop: 6 }}>
        <T x size={13}>Watch out… </T>
        {stripLead(p.watchOut)}
      </T>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        <T size={13}>
          Games with {p.name}: <T x size={13}>{games.played}</T>
        </T>
        <T size={13}>
          Wins: <T x size={13}>{games.won}</T>
        </T>
      </View>
      {note ? <Note style={{ marginTop: 12 }}>{note}</Note> : null}
    </Screen>
  );
}
