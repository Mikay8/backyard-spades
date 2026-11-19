// Partner card — design canvas "Pick Your Partner" grid card. Accent strip,
// framed portrait, name/role/quirk, item chips, stat dots, good-if / watch-out,
// and Pick / Buy / View action.
import React from 'react';
import { Pressable, View } from 'react-native';
import { IMAGES } from '../assets/images';
import { COLORS } from '../constants/theme';
import { ITEMS, effectiveStats, itemById } from '../constants/items';
import { PARTNER_ACCENT, STAT_LABELS, STAT_ORDER, stripLead, type PartnerDef } from '../constants/partners';
import { useApp } from '../state/store';
import { BtnS, Frame, Panel, Pix, T, statDots, usePalette } from './ui';

/** Small padlock drawn with Views (no icon font needed). */
export const Lock: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <View style={{ width: size, height: size, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no">
    <View style={{ width: size * 0.5, height: size * 0.45, borderWidth: 2, borderBottomWidth: 0, borderColor: COLORS.ink, borderTopLeftRadius: size, borderTopRightRadius: size }} />
    <View style={{ width: size * 0.75, height: size * 0.45, borderWidth: 2, borderColor: COLORS.ink }} />
  </View>
);

export const partnerButtonLabel = (p: PartnerDef, owned: boolean, picked: boolean, rank: number, coins: number) =>
  owned ? (picked ? 'Picked ✓' : 'Pick') : rank >= p.unlockRank ? (coins >= p.price ? 'Buy' : `Need ${p.price} Coins`) : `Reach Rank ${p.unlockRank}`;

/** Item chips — tap to equip/take off an owned item on this partner. */
export const ItemChips: React.FC<{ partnerId: string; big?: boolean }> = ({ partnerId, big }) => {
  const { profile, equipItem } = useApp();
  const pal = usePalette();
  const owned = ITEMS.filter((it) => !it.once && profile.items[it.id]);
  if (owned.length === 0) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
      <T x size={big ? 13 : 11}>
        Items
      </T>
      {owned.map((it) => {
        const on = profile.equip[partnerId] === it.id;
        return (
          <Pressable
            key={it.id}
            onPress={() => equipItem(it.id, partnerId)}
            accessibilityRole="button"
            accessibilityLabel={`${on ? 'Take off' : 'Equip'} ${it.name}`}
            accessibilityState={{ selected: on }}
            style={{
              width: 38,
              height: 38,
              borderWidth: 3,
              borderColor: COLORS.ink,
              borderRadius: 6,
              backgroundColor: on ? COLORS.sun : COLORS.paper,
              boxShadow: on ? `0 0 0 3px ${pal.tomato}` : undefined,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pix uri={IMAGES[`i-${it.id}`]} size={24} />
          </Pressable>
        );
      })}
    </View>
  );
};

export const PartnerCard: React.FC<{
  partner: PartnerDef;
  picked: boolean;
  onTap: () => void;
  onAction: () => void;
  onView: () => void;
}> = ({ partner: p, picked, onTap, onAction, onView }) => {
  const { profile, rank } = useApp();
  const owned = profile.owned.includes(p.id);
  const itemId = profile.equip[p.id] ?? null;
  const item = itemById(itemId);
  const stats = effectiveStats(p, item);
  return (
    <Panel picked={picked} style={{ flex: 1 }}>
      <View style={{ height: 8, backgroundColor: PARTNER_ACCENT[p.id] }} />
      <View style={owned ? undefined : ({ filter: 'grayscale(1)', opacity: 0.7 } as object)}>
        <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel={p.name} style={{ paddingHorizontal: 8, paddingTop: 8 }}>
          <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 6 }}>
            <Frame stem={p.portrait} size={80} item={itemId} label={`${p.name} portrait`} />
          </View>
          <T x size={15}>
            {p.name}
          </T>
          <T size={12} style={{ opacity: 0.85 }}>
            {p.role}
          </T>
          <T size={12} style={{ marginTop: 4, marginBottom: 6, minHeight: 48 }}>
            {p.quirk}
          </T>
        </Pressable>
        <View style={{ paddingHorizontal: 8 }}>
          {owned ? <ItemChips partnerId={p.id} /> : null}
          {item ? (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <Pix uri={IMAGES[`i-${item.id}`]} size={20} />
              <T x size={11}>
                {item.name}
              </T>
            </View>
          ) : null}
          {STAT_ORDER.map((k) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T size={11} style={{ flex: 1 }}>
                {STAT_LABELS[k]}
                {stats[k] > p.stats[k] ? ' ▲' : ''}
              </T>
              <T size={9} style={{ letterSpacing: 1 }} accessibilityLabel={`${stats[k]} of 5`}>
                {statDots(p.stats[k], stats[k])}
              </T>
            </View>
          ))}
          <T size={11} style={{ marginTop: 6 }}>
            <T x size={11}>Good with you if… </T>
            {stripLead(p.goodWith)}
          </T>
          <T size={11} style={{ marginTop: 4 }}>
            <T x size={11}>Watch out… </T>
            {stripLead(p.watchOut)}
          </T>
        </View>
      </View>
      <View style={{ padding: 8, marginTop: 'auto' }}>
        {owned ? (
          <BtnS label={partnerButtonLabel(p, owned, picked, rank, profile.coins)} size={14} onPress={onAction} style={{ minHeight: 44 }} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Lock />
              <T x size={12}>
                Rank {p.unlockRank} • {p.price} Coins
              </T>
            </View>
            <BtnS label="View" size={14} onPress={onView} style={{ minHeight: 44 }} />
          </>
        )}
      </View>
    </Panel>
  );
};
