// Pick Your Partner — design canvas. Two-column card grid; sticky footer with
// the picked partner and START GAME.
import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '../navigation';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PartnerCard } from '../components/PartnerCard';
import { BuySheet } from '../components/sheets';
import { Avatar, BtnP, Header, Screen, T, Toast } from '../components/ui';
import { PARTNERS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Pick() {
  const { profile, rank, startGame, setPicked } = useApp();
  const params = useLocalSearchParams<{ partner?: string }>();
  const [buyId, setBuyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (params.partner) setPicked(params.partner);
  }, [params.partner, setPicked]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const picked = partnerById(profile.owned.includes(profile.picked) ? profile.picked : 'grandma');
  const view = (id: string) => router.push({ pathname: '/partner', params: { id } });

  const rows: (typeof PARTNERS)[] = [];
  for (let i = 0; i < PARTNERS.length; i += 2) rows.push(PARTNERS.slice(i, i + 2));

  return (
    <Screen
      header={<Header title="PICK YOUR PARTNER" titleSize={13} subtitle="Who’s sitting across from you?" onBack={() => goBack()} />}
      contentStyle={{ paddingTop: 6, gap: 12 }}
      footer={
        <>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Avatar stem={picked.portrait} size={40} item={profile.equip[picked.id]} />
            <T x size={13} style={{ flex: 1 }}>
              {picked.name} — {picked.quirk}
            </T>
          </View>
          <BtnP
            label="START GAME"
            onPress={() => {
              startGame(picked.id);
              router.push('/game');
            }}
            testID="start-game"
          />
        </>
      }
      overlay={
        <>
          <BuySheet
            partnerId={buyId}
            onClose={() => setBuyId(null)}
            onBought={(id) => {
              setToast(`${partnerById(id).name} joined the family.`);
              setPicked(id);
            }}
          />
          <Toast text={toast} bottom={150} />
        </>
      }
    >
      {rows.map((row) => (
        <View key={row[0].id} style={{ flexDirection: 'row', gap: 12 }}>
          {row.map((p) => {
            const owned = profile.owned.includes(p.id);
            const canBuy = rank >= p.unlockRank && profile.coins >= p.price;
            return (
              <PartnerCard
                key={p.id}
                partner={p}
                picked={picked.id === p.id}
                onTap={() => (owned ? setPicked(p.id) : view(p.id))}
                onAction={() => (owned ? setPicked(p.id) : canBuy ? setBuyId(p.id) : view(p.id))}
                onView={() => view(p.id)}
              />
            );
          })}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </Screen>
  );
}
