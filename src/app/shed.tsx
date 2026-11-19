// The Shed — design canvas. Buy items with Coins and equip one per partner.
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { IMAGES } from '../assets/images';
import { Avatar, BtnS, Coin, Frame, Header, Panel, Pix, Screen, T, Toast } from '../components/ui';
import { ITEMS, partnerFirstName } from '../constants/items';
import { STAT_LABELS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

export default function Shed() {
  const { profile, buyItem, equipItem } = useApp();
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  const pk = partnerById(profile.picked);

  return (
    <Screen
      header={
        <>
          <Header
            title="THE SHED"
            onBack={() => router.back()}
            right={
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Coin />
                <T x size={13}>
                  {profile.coins} Coins
                </T>
              </View>
            }
          />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
            <Avatar stem={pk.portrait} size={40} item={profile.equip[pk.id]} />
            <View style={{ flex: 1 }}>
              <T x size={13}>
                Equipping to {pk.name}
              </T>
              <T size={12}>Change who you equip on the Pick screen.</T>
            </View>
          </View>
        </>
      }
      contentStyle={{ gap: 10, paddingBottom: 20 }}
      overlay={<Toast text={toast} />}
    >
      {ITEMS.map((it) => {
        const own = it.once ? profile.mirror > 0 : !!profile.items[it.id];
        const on = !it.once && profile.equip[pk.id] === it.id;
        const by = Object.keys(profile.equip).find((k) => profile.equip[k] === it.id);
        const boost = it.once ? 'Look at every hand — one time' : it.lucky ? '+1 to the lowest stat' : it.boost.map((k) => `+1 ${STAT_LABELS[k]}`).join(' • ');
        const btn = it.once
          ? profile.coins >= it.price
            ? `Buy — ${it.price}`
            : `Need ${it.price} Coins`
          : own
            ? on
              ? 'Take off'
              : 'Equip'
            : profile.coins >= it.price
              ? `Buy — ${it.price}`
              : `Need ${it.price} Coins`;
        const using = it.once
          ? `You have ${profile.mirror} ${profile.mirror === 1 ? 'peek' : 'peeks'}`
          : on
            ? `On ${partnerFirstName(pk.id)}`
            : by
              ? `On ${partnerFirstName(by)}`
              : '';
        return (
          <Panel key={it.id} picked={on} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
            <Frame size={56}>
              <Pix uri={IMAGES[`i-${it.id}`]} size={40} />
            </Frame>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T x size={15}>
                {it.name}
              </T>
              <T size={12}>{boost}</T>
              {it.note ? (
                <T size={11} style={{ marginTop: 2 }}>
                  {it.note}
                </T>
              ) : null}
              {using ? (
                <T x size={11} style={{ marginTop: 2 }}>
                  {using}
                </T>
              ) : null}
            </View>
            <BtnS
              label={btn}
              size={13}
              disabled={(it.once || !own) && profile.coins < it.price}
              style={{ width: 96, minHeight: 44, paddingHorizontal: 6 }}
              onPress={() => {
                if (it.once || !own) {
                  if (buyItem(it.id)) setToast(`${it.name} is yours.`);
                } else {
                  equipItem(it.id, pk.id);
                }
              }}
            />
          </Panel>
        );
      })}
      <T size={12}>Items add +1 to a partner’s stat (up to 5). One item per partner. Coins you earn from playing buy items too.</T>
    </Screen>
  );
}
