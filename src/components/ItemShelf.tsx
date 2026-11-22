// Shed items as a shelf — shown under the partner card on Pick Your Partner.
// Buy with Coins (short of Coins → "Get Coins" opens the Coin Shop), equip
// one item on the partner you're looking at.
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { IMAGES } from '../assets/images';
import { ITEMS, partnerFirstName } from '../constants/items';
import { STAT_LABELS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';
import { BtnS, Frame, Panel, Pix, T } from './ui';

export const ItemShelf: React.FC<{ partnerId: string; onToast: (t: string) => void }> = ({ partnerId, onToast }) => {
  const { profile, buyItem, equipItem } = useApp();
  const partner = partnerById(partnerId);
  const first = partnerFirstName(partnerId);
  const ownsPartner = profile.owned.includes(partnerId);

  return (
    <View style={{ gap: 10 }}>
      <View>
        <T px size={11} accessibilityRole="header">
          ITEMS FOR {first.toUpperCase()}
        </T>
        <T size={12} style={{ marginTop: 4 }}>
          {ownsPartner
            ? `Each item adds +1 to a stat or two and changes how ${first} plays. One item per partner.`
            : `Unlock ${partner.name} to equip items. You can still buy them now.`}
        </T>
      </View>
      {ITEMS.map((it) => {
        const own = it.once ? profile.mirror > 0 : !!profile.items[it.id];
        const on = !it.once && profile.equip[partnerId] === it.id;
        const by = Object.keys(profile.equip).find((k) => profile.equip[k] === it.id);
        const canAfford = profile.coins >= it.price;
        const buying = it.once || !own;
        const boost = it.once ? 'Look at every hand — one time' : it.lucky ? '+1 to the lowest stat' : it.boost.map((k) => `+1 ${STAT_LABELS[k]}`).join(' • ');
        const btn = buying ? (canAfford ? `Buy — ${it.price}` : 'Get Coins') : on ? 'Take off' : 'Equip';
        const using = it.once
          ? `You have ${profile.mirror} ${profile.mirror === 1 ? 'peek' : 'peeks'}`
          : on
            ? `On ${first}`
            : by
              ? `On ${partnerFirstName(by)}`
              : '';
        return (
          <Panel key={it.id} picked={on} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
            <Frame size={48}>
              <Pix uri={IMAGES[`i-${it.id}`]} size={34} />
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
              disabled={!buying && !ownsPartner}
              style={{ width: 96, minHeight: 44, paddingHorizontal: 6 }}
              onPress={() => {
                if (buying) {
                  if (!canAfford) router.push('/coins');
                  else if (buyItem(it.id)) onToast(`${it.name} is yours.`);
                } else {
                  equipItem(it.id, partnerId);
                }
              }}
            />
          </Panel>
        );
      })}
    </View>
  );
};
