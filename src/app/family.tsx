// The Family — design canvas. One row per partner: framed portrait, quirk,
// lock/rank tag, and Pick / Buy / View. Favourite (Rank 10+) kept from v1.
import { router } from 'expo-router';
import { goBack } from '../navigation';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Lock } from '../components/PartnerCard';
import { BuySheet } from '../components/sheets';
import { BtnS, Coin, Frame, Header, Panel, Screen, T, Toast } from '../components/ui';
import { PARTNERS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Family() {
  const { profile, rank, setPicked, setFavourite } = useApp();
  const [buyId, setBuyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const allOwned = PARTNERS.every((p) => profile.owned.includes(p.id));
  const view = (id: string) => router.push({ pathname: '/partner', params: { id } });

  return (
    <Screen
      header={
        <Header
          title="THE FAMILY"
          onBack={() => goBack()}
          right={
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Coin />
                <T x size={13}>
                  {profile.coins} Coins
                </T>
              </View>
              <T x size={13}>
                Rank {rank}
              </T>
            </View>
          }
        />
      }
      contentStyle={{ paddingTop: 6, gap: 10 }}
      overlay={
        <>
          <BuySheet
            partnerId={buyId}
            onClose={() => setBuyId(null)}
            onBought={(id) => setToast(`${partnerById(id).name} joined the family.`)}
          />
          <Toast text={toast} />
        </>
      }
    >
      {allOwned ? (
        <T x size={14}>
          The whole family is here.
        </T>
      ) : null}
      {PARTNERS.map((p) => {
        const owned = profile.owned.includes(p.id);
        const picked = profile.picked === p.id;
        const canBuy = rank >= p.unlockRank && profile.coins >= p.price;
        const fav = profile.favourite === p.id;
        return (
          <Panel key={p.id} picked={picked} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
            <Pressable onPress={() => view(p.id)} accessibilityRole="button" accessibilityLabel={`${p.name} details`}>
              <Frame stem={p.portrait} size={64} item={profile.equip[p.id]} grey={!owned} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T x size={15}>
                {p.name}
                {fav ? ' ★' : ''}
              </T>
              <T size={12} style={{ marginTop: 2, marginBottom: 6 }}>
                {p.quirk}
              </T>
              {!owned ? (
                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                  <Lock size={14} />
                  <T x size={12}>
                    Rank {p.unlockRank} • {p.price} Coins
                  </T>
                </View>
              ) : rank >= 10 ? (
                <Pressable onPress={() => setFavourite(p.id)} accessibilityRole="button" style={{ minHeight: 32, justifyContent: 'center' }}>
                  <T x size={12} style={{ textDecorationLine: 'underline' }}>
                    {fav ? '★ Favourite partner' : '☆ Save as favourite'}
                  </T>
                </Pressable>
              ) : null}
            </View>
            <BtnS
              label={owned ? (picked ? 'Picked ✓' : 'Pick') : canBuy ? 'Buy' : 'View'}
              size={13}
              style={{ width: 96, minHeight: 44, paddingHorizontal: 6 }}
              onPress={() => (owned ? setPicked(p.id) : canBuy ? setBuyId(p.id) : view(p.id))}
            />
          </Panel>
        );
      })}
      <T size={12} style={{ opacity: 0.85 }}>
        Coins come from playing games. Higher ranks open the rest of the family.
      </T>
    </Screen>
  );
}
