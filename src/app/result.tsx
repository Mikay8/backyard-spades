// Game Result — design canvas scorecard ticket. Partner portrait (happy or
// wince), final score, deal-by-deal rows, partner review, rank-up banner,
// Coins + XP, unlock card, Play Again / Home / Share sheet.
import { router } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { BuySheet, InkLine, rankLine } from '../components/sheets';
import { Avatar, Bar, BtnP, BtnS, Coin, Frame, IconBtn, Note, Panel, Screen, Sheet, T, Toast, coinsText } from '../components/ui';
import { COLORS, FONT } from '../constants/theme';
import { partnerById, xpIntoRank } from '../constants/partners';
import { useApp } from '../state/store';

const fmt = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export default function Result() {
  const { result, lastResult, profile } = useApp();
  const [share, setShare] = useState(false);
  const [buyId, setBuyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const res = result ?? lastResult;
  const readOnly = result === null;

  const p = partnerById(res?.partnerId ?? 'grandma');
  const lastDeal = res?.deals[res.deals.length - 1];
  const [shareText, setShareText] = useState(() =>
    res
      ? [
          `Backyard Spades — with ${p.name}`,
          `${res.won ? 'Won' : 'Lost'} ${res.finalUs} to ${res.finalThem}`,
          lastDeal ? `Promised ${lastDeal.usPromise}, won ${lastDeal.usWon} in the last deal` : '',
          'Beat our score?',
        ]
          .filter(Boolean)
          .join('\n')
      : '',
  );

  if (!res) {
    return (
      <Screen contentStyle={{ paddingTop: 40, gap: 12 }}>
        <T x size={15}>
          No game result to show yet.
        </T>
        <BtnP label="BACK TO HOME" size={12} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const rankedUp = res.rankAfter > res.rankBefore;
  const unlock = res.newlyBuyable[0] ?? null;
  const item = profile.equip[p.id];
  const missedBy = lastDeal ? Math.max(0, lastDeal.usPromise - lastDeal.usWon) : 0;

  const doShare = async () => {
    try {
      const nav = (globalThis as unknown as { navigator?: { share?: (d: { text: string }) => Promise<void>; clipboard?: { writeText: (t: string) => Promise<void> } } }).navigator;
      if (nav?.share) await nav.share({ text: shareText });
      else if (nav?.clipboard) await nav.clipboard.writeText(shareText);
      setToast('Copied');
    } catch {
      setToast('Couldn’t share — copy the text instead');
    }
    setShare(false);
    setTimeout(() => setToast(null), 1600);
  };

  return (
    <Screen
      contentStyle={{ paddingTop: 18, paddingBottom: 28, gap: 14 }}
      overlay={
        <>
          <Sheet visible={share} onClose={() => setShare(false)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T x size={18}>
                Share your result
              </T>
              <IconBtn icon="close" label="Close" onPress={() => setShare(false)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 128, height: 160, backgroundColor: COLORS.cream, borderWidth: 4, borderColor: COLORS.ink, padding: 8, alignItems: 'center', gap: 6 }}>
                <Avatar stem={p.portrait} size={80} mood={res.won ? 'happy' : 'wince'} item={item} />
                <T px size={12}>
                  {res.finalUs} to {res.finalThem}
                </T>
                <T size={10} center>
                  +{res.coinsEarned} Coins
                </T>
              </View>
              <TextInput
                multiline
                value={shareText}
                onChangeText={setShareText}
                accessibilityLabel="Share text"
                style={{ flex: 1, minHeight: 160, borderWidth: 3, borderColor: COLORS.ink, padding: 8, fontFamily: FONT.body, fontSize: 15, lineHeight: 20, color: COLORS.ink, backgroundColor: '#fff', textAlignVertical: 'top' }}
              />
            </View>
            <T size={12}>Tap the text to edit it before sending. The share never shows card order or the deck.</T>
            <BtnP label="SHARE" size={12} onPress={() => void doShare()} />
          </Sheet>
          <BuySheet partnerId={buyId} onClose={() => setBuyId(null)} onBought={(id) => setToast(`${partnerById(id).name} joined the family.`)} />
          <Toast text={toast} />
        </>
      }
    >
      <T px size={10} center>
        BACKYARD SPADES • SCORECARD
      </T>

      <Panel style={{ padding: 14, borderRadius: 6 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Frame stem={p.portrait} size={80} mood={res.won ? 'happy' : 'wince'} item={item} label={p.name} />
          <View style={{ flex: 1 }}>
            <T px size={14} accessibilityRole="header">
              {res.won ? 'You won the game' : 'They won the game'}
            </T>
            <T px size={20} style={{ marginTop: 6 }}>
              {res.finalUs} to {res.finalThem}
            </T>
          </View>
        </View>
        <InkLine />
        {res.deals.map((d) => (
          <View key={d.deal} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
            <T size={13} style={{ width: 62 }}>
              Deal {d.deal}
            </T>
            <T size={13} style={{ flex: 1 }}>
              Promised {d.usPromise} • Won {d.usWon}
            </T>
            <T px size={11}>
              {fmt(d.usPoints)}
            </T>
          </View>
        ))}
        <InkLine />
        <T x size={15}>
          {res.partnerReview}
        </T>
        {res.partnerReview2 ? (
          <T size={14} style={{ marginTop: 4 }}>
            {res.partnerReview2}
          </T>
        ) : null}
        {!res.won && lastDeal && missedBy > 0 ? (
          <T size={14} style={{ marginTop: 6 }}>
            Close — you missed your promise by {missedBy} round{missedBy === 1 ? '' : 's'} in Deal {lastDeal.deal}.
          </T>
        ) : null}
      </Panel>

      {rankedUp ? (
        <View style={{ backgroundColor: COLORS.sun, borderWidth: 4, borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }}>
          <T x size={15}>
            {unlock ? `Rank ${res.rankAfter} reached — ${unlock.name} is ready to buy!` : `Rank ${res.rankAfter} reached!`}
          </T>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Coin size={27} />
        <T px size={13}>
          +{res.coinsEarned} Coins
        </T>
        <T size={13} style={{ opacity: 0.8 }}>
          → {coinsText(profile.coins)} Coins
        </T>
      </View>
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T x size={13}>
            +{res.xpEarned} XP
          </T>
          <T x size={13}>
            {rankLine(res.rankAfter, profile.xp)}
          </T>
        </View>
        <Bar pct={xpIntoRank(profile.xp)} style={{ marginTop: 6 }} />
      </View>
      {res.playerWentZeroClean ? <T size={13}>Go zero and won none: +50 XP and +10 Coins included.</T> : null}

      {!readOnly && unlock && !profile.owned.includes(unlock.id) ? (
        <Panel style={{ flexDirection: 'row', gap: 10, padding: 10, alignItems: 'center' }}>
          <Avatar stem={unlock.portrait} size={80} />
          <View style={{ flex: 1 }}>
            <T x size={15}>
              {unlock.name}
            </T>
            <T size={12}>{unlock.price} Coins</T>
          </View>
          <BtnS label="Buy" size={14} style={{ width: 72, minHeight: 44 }} onPress={() => setBuyId(unlock.id)} />
        </Panel>
      ) : null}
      {readOnly ? <Note>This is your last game’s scorecard.</Note> : null}

      {!readOnly ? (
        <BtnP label="PLAY AGAIN" onPress={() => router.push({ pathname: '/pick', params: { partner: res.partnerId } })} testID="play-again" />
      ) : null}
      <BtnS label="Back to Home" onPress={() => router.replace('/')} />
      <BtnS label="Share Result" onPress={() => setShare(true)} />
    </Screen>
  );
}
