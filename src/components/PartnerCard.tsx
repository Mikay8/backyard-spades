// Partner card — brief §12.2 / §12.5. Owned, locked, selected, and detail states.
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { type PartnerDef } from '../constants/partners';
import { Icon, PartnerBlurb, Portrait, StatBars, styles } from './ui';

export const PartnerCard: React.FC<{
  partner: PartnerDef;
  owned: boolean;
  rank: number;
  coins: number;
  selected?: boolean;
  favourite?: boolean;
  gamesPlayed?: number;
  gamesWon?: number;
  onPick?: () => void;
  onBuy?: () => void;
  onFavourite?: () => void;
  showBuy?: boolean;
}> = ({ partner, owned, rank, coins, selected, favourite, gamesPlayed, gamesWon, onPick, onBuy, onFavourite, showBuy }) => {
  const [expanded, setExpanded] = useState(false);
  const locked = !owned;
  const rankReached = rank >= partner.unlockRank;
  const canBuy = locked && rankReached && coins >= partner.price;
  return (
    <View
      style={[
        styles.card,
        {
          marginTop: 10,
          borderWidth: selected ? 3 : 1,
          borderColor: selected ? COLORS.accent : COLORS.line,
          opacity: locked ? 0.92 : 1,
        },
      ]}
    >
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Portrait stem={partner.portrait} size={56} grey={locked} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink }}>
              {partner.name}
              {favourite ? ' ★' : ''}
            </Text>
            <Text style={styles.small}>{partner.role}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Icon name={partner.icon} size={16} />
              <Text style={[styles.small, { marginLeft: 4, flex: 1 }]}>{partner.quirk}</Text>
            </View>
          </View>
          {locked ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.inkSoft }}>
                Rank {partner.unlockRank} • {partner.price} Coins
              </Text>
            </View>
          ) : selected ? (
            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.accent }}>Picked ✓</Text>
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <View>
          <StatBars stats={partner.stats} />
          <View style={{ marginTop: 10 }}>
            <PartnerBlurb partner={partner} />
          </View>
          {typeof gamesPlayed === 'number' ? (
            <Text style={[styles.small, { marginTop: 8 }]}>
              Played together {gamesPlayed} time{gamesPlayed === 1 ? '' : 's'} • Won {gamesWon ?? 0}
            </Text>
          ) : null}
        </View>
      ) : (
        <StatBars stats={partner.stats} />
      )}

      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {owned ? (
          <Pressable
            onPress={onPick}
            style={{
              flex: 1,
              backgroundColor: selected ? COLORS.accent : COLORS.grass,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={`Pick ${partner.name}`}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>{selected ? 'Picked ✓' : 'Pick'}</Text>
          </Pressable>
        ) : showBuy ? (
          <Pressable
            onPress={onBuy}
            disabled={!canBuy}
            style={{
              flex: 1,
              backgroundColor: canBuy ? COLORS.accent : '#D8D2C0',
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={`Buy ${partner.name} for ${partner.price} Coins`}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {canBuy
                ? `Buy — ${partner.price} Coins`
                : !rankReached
                  ? `Reach Rank ${partner.unlockRank}`
                  : `Need ${partner.price - coins} more Coins`}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={{ marginLeft: 8, paddingVertical: 10, paddingHorizontal: 12 }}
          accessibilityRole="button"
        >
          <Text style={{ color: COLORS.inkSoft, fontWeight: '700' }}>{expanded ? 'Less ▲' : 'More ▼'}</Text>
        </Pressable>
      </View>
      {owned && rank >= 10 && onFavourite ? (
        <Pressable
          onPress={onFavourite}
          style={{ marginTop: 8, alignItems: 'center', paddingVertical: 6 }}
          accessibilityRole="button"
          accessibilityLabel={favourite ? 'Remove favourite partner' : 'Save as favourite partner'}
        >
          <Text style={{ color: COLORS.accent, fontWeight: '800' }}>
            {favourite ? '★ Favourite partner' : '☆ Save as favourite'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};
