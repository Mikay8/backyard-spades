// Shared bottom sheets — Rank details and Buy partner.
import React from 'react';
import { View } from 'react-native';
import { PARTNERS, partnerById, xpIntoRank } from '../constants/partners';
import { useApp } from '../state/store';
import { Avatar, Bar, BtnP, BtnS, Divider, IconBtn, Note, Sheet, T, coinsText } from './ui';

export const rankLine = (rank: number, xp: number) => `Rank ${rank} — ${100 - xpIntoRank(xp)} XP to Rank ${rank + 1}`;

export const RankSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { profile, rank } = useApp();
  const next = PARTNERS.filter((p) => p.unlockRank > rank).sort((a, b) => a.unlockRank - b.unlockRank)[0];
  const extra = (r: number) => (r === 5 ? ' + See the promise' : r === 10 ? ' + Favourite + review' : r === 15 ? ' + Table themes' : '');
  const rate = profile.gamesPlayed ? `${Math.round((100 * profile.wins) / profile.gamesPlayed)}%` : '—';
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T px size={22}>
          RANK {rank}
        </T>
        <IconBtn icon="close" label="Close" onPress={onClose} />
      </View>
      <Bar pct={xpIntoRank(profile.xp)} label="XP toward next rank" />
      <T size={13}>{rankLine(rank, profile.xp)}</T>
      <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
        <T size={13}>
          Games: <T x size={13}>{profile.gamesPlayed}</T>
        </T>
        <T size={13}>
          Wins: <T x size={13}>{profile.wins}</T>
        </T>
        <T size={13}>
          Win rate: <T x size={13}>{rate}</T>
        </T>
      </View>
      <Note>
        {next
          ? `Next unlock: Rank ${next.unlockRank} — ${next.name} (${next.price} Coins)${extra(next.unlockRank)}`
          : 'Every partner is unlocked.'}
      </Note>
      <View>
        <T x size={14} style={{ marginBottom: 4 }}>
          Unlocks
        </T>
        {PARTNERS.filter((p) => p.unlockRank > 1).map((p) => (
          <View key={p.id}>
            <Divider />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, opacity: rank >= p.unlockRank ? 1 : 0.85 }}>
              <T size={13}>
                Rank {p.unlockRank} — {p.name}
              </T>
              <T size={13}>{p.price} Coins</T>
            </View>
          </View>
        ))}
        {[
          [5, 'See the promise'],
          [10, 'Favourite + review'],
          [15, 'Table themes'],
        ].map(([r, t]) => (
          <View key={String(r)}>
            <Divider />
            <T size={13} style={{ paddingVertical: 4 }}>
              Rank {r} — {t}
            </T>
          </View>
        ))}
      </View>
    </Sheet>
  );
};

export const BuySheet: React.FC<{
  partnerId: string | null;
  onClose: () => void;
  onBought?: (id: string) => void;
}> = ({ partnerId, onClose, onBought }) => {
  const { profile, rank, buyPartner } = useApp();
  const p = partnerById(partnerId ?? 'marcus');
  const rankShort = rank < p.unlockRank;
  const short = !rankShort && profile.coins < p.price;
  const ok = !rankShort && !short;
  return (
    <Sheet visible={!!partnerId} onClose={onClose}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Avatar stem={p.portrait} size={80} />
        <View style={{ flex: 1 }}>
          <T x size={18}>
            Buy {p.name} for {p.price} Coins?
          </T>
          <T size={13} style={{ marginTop: 4 }}>
            You have {coinsText(profile.coins)} Coins.
          </T>
        </View>
      </View>
      {short ? (
        <T size={13}>
          You have {coinsText(profile.coins)} Coins — you need {p.price}. Play more games to earn Coins.
        </T>
      ) : null}
      {rankShort ? <T size={13}>Play more games to reach Rank {p.unlockRank}.</T> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <BtnS label="Cancel" onPress={onClose} />
        </View>
        {ok ? (
          <View style={{ flex: 1 }}>
            <BtnP
              label="BUY"
              size={12}
              onPress={() => {
                if (partnerId && buyPartner(partnerId)) onBought?.(partnerId);
                onClose();
              }}
            />
          </View>
        ) : null}
      </View>
    </Sheet>
  );
};

export const InkLine: React.FC = () => <View style={{ height: 3, borderTopWidth: 3, borderStyle: 'dashed', borderColor: '#b8ac8a', marginVertical: 10 }} />;

