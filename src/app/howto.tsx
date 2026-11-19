// How to Play — design canvas. Numbered, colour-headed panels with little
// worked examples. The "Know Spades?" box at the bottom is the ONLY place the
// old Spades words (bid / trick / trump / bag / nil) may appear.
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { IMAGES } from '../assets/images';
import { BtnP, BtnS, Coin, Divider, Frame, Header, MiniCard, Pix, Screen, T, usePalette } from '../components/ui';
import { COLORS } from '../constants/theme';
import { ITEMS } from '../constants/items';
import { PARTNERS, partnerById, stripLead } from '../constants/partners';
import { useApp } from '../state/store';
import { type Card } from '../engine/cards';

const c = (suit: Card['suit'], rank: number): Card => ({ suit, rank });

const HP: React.FC<{ n?: number; title?: string; color?: string; bg?: string; children: React.ReactNode }> = ({ n, title, color, bg, children }) => (
  <View style={{ backgroundColor: bg ?? COLORS.paper, borderWidth: 4, borderColor: COLORS.ink, borderRadius: 10, overflow: 'hidden', boxShadow: `0 4px 0 ${COLORS.ink}` }}>
    {title ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: color, borderBottomWidth: 4, borderColor: COLORS.ink }}>
        <View style={{ width: 30, height: 30, backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
          <T px size={12}>
            {n}
          </T>
        </View>
        <T x size={16} color="#fff" accessibilityRole="header">
          {title}
        </T>
      </View>
    ) : null}
    <View style={{ padding: 12, gap: 8 }}>{children}</View>
  </View>
);

const Bub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ backgroundColor: COLORS.note, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8 }}>
    <T size={12} center>
      {children}
    </T>
  </View>
);

const HNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ backgroundColor: COLORS.noteSoft, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 9 }}>
    <T size={12}>{children}</T>
  </View>
);

const HRow: React.FC<{ l: string; r: string; ok?: boolean }> = ({ l, r, ok }) => {
  const pal = usePalette();
  return (
    <View>
      <Divider />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', paddingVertical: 5 }}>
        <T size={12} style={{ flex: 1 }}>
          {l}
        </T>
        <T x size={14} color={ok ? pal.ok : pal.bad}>
          {r}
        </T>
      </View>
    </View>
  );
};

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>{children}</View>
);

export default function HowToPlay() {
  const { profile } = useApp();
  const pal = usePalette();
  const pk = partnerById(profile.picked);
  return (
    <Screen
      header={
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pix uri={IMAGES['s-S']} size={28} />
            <T px size={14} accessibilityRole="header">
              HOW TO PLAY
            </T>
          </View>
          <Header title="" onBack={() => router.back()} icon="close" iconRight />
        </View>
      }
      contentStyle={{ paddingTop: 4, gap: 14 }}
    >
      <HP n={1} title="The goal" color="#c9432a">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T px size={22} color={pal.tomato}>
            500
          </T>
          <T size={14} style={{ flex: 1 }}>
            Win the rounds you promised. First team to <T x>500 points</T> wins the game.
          </T>
        </View>
        <Row>
          <View style={{ borderWidth: 3, borderColor: COLORS.ink, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#cfe9d4' }}>
            <T x size={12}>
              You + Partner
            </T>
          </View>
          <T px size={10}>
            VS
          </T>
          <View style={{ borderWidth: 3, borderColor: COLORS.ink, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f4cfc6' }}>
            <T x size={12}>
              The other side
            </T>
          </View>
        </Row>
      </HP>

      <HP n={2} title="The table" color="#2f6f8a">
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={{ alignItems: 'center' }}>
            <Frame stem={pk.portrait} size={48} />
            <T x size={11}>
              Your partner
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Frame stem="p-nbrL" size={48} />
              <T x size={11}>
                Other side
              </T>
            </View>
            <View style={{ flex: 1, backgroundColor: '#e9d9a8', borderWidth: 3, borderStyle: 'dashed', borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}>
              <T x size={12}>
                Table
              </T>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Frame stem="p-nbrR" size={48} />
              <T x size={11}>
                Other side
              </T>
            </View>
          </View>
          <View style={{ backgroundColor: COLORS.sun, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 30 }}>
            <T x size={13}>
              You
            </T>
          </View>
        </View>
        <T size={13}>You and your partner sit across from each other and share one score.</T>
      </HP>

      <HP n={3} title="Promise" color="#b8571a">
        <T size={14}>Before each deal, say how many rounds you think you’ll win. Count your aces and high spades.</T>
        <Row>
          <MiniCard card={c('S', 14)} />
          <MiniCard card={c('S', 13)} />
          <MiniCard card={c('H', 14)} />
          <T px size={12}>
            =
          </T>
          <Bub>
            3 likely winners{'\n'}
            <T x size={12}>
              Promise 3
            </T>
          </Bub>
        </Row>
        <HNote>
          Promise <T x size={12}>0</T> = going zero. Win none: <T x size={12} color={pal.ok}>+100</T>. Win even one:{' '}
          <T x size={12} color={pal.bad}>
            −100
          </T>
          .
        </HNote>
      </HP>

      <HP n={4} title="A round" color="#1f7a70">
        <T size={14}>Everyone plays one card. Follow the suit if you can. The highest card of that suit takes the pile.</T>
        <Row>
          <MiniCard card={c('H', 10)} />
          <MiniCard card={c('H', 7)} />
          <MiniCard card={c('H', 12)} win />
          <MiniCard card={c('H', 4)} />
        </Row>
        <T x size={12} center>
          Hearts led — the Queen takes the round
        </T>
        <Row>
          <MiniCard card={c('H', 9)} />
          <MiniCard card={c('S', 2)} win />
          <MiniCard card={c('H', 13)} />
          <Bub>
            Spades beat{'\n'}
            <T x size={12}>
              everything
            </T>
          </Bub>
        </Row>
        <HNote>You can’t start a round with a spade until one has been played.</HNote>
      </HP>

      <HP n={5} title="Scoring" color="#7a5aa8">
        <T size={14}>
          Make your team promise: <T x>10 points per round promised</T>, plus 1 per extra. Miss it: lose 10 per round promised.
        </T>
        <View>
          <HRow l="Promise 3 + 4 = 7, win 7" r="+70" ok />
          <HRow l="Promise 9, win 10 (1 extra)" r="+91" ok />
          <HRow l="Promise 8, win 6" r="−80" />
          <HRow l="Goes zero, wins none, team makes 6" r="+160" ok />
          <HRow l="Goes zero but wins 1" r="−40" />
          <HRow l="8 extras banked, win 3 more" r="−100" />
        </View>
        <T size={12}>With 8 extras banked and 3 more won, you lose 100 and 1 carries over. A team at −200 loses.</T>
      </HP>

      <HP n={6} title="Extras" color="#2f7d4a">
        <T size={14}>
          Extras are rounds you win <T x>over</T> your promise. Every <T x>10 extras</T> costs you 100 points, so winning too many hurts.
        </T>
        <Row>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={{ width: 20, height: 20, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 4, backgroundColor: i < 8 ? pal.tomato : COLORS.paper }}
            />
          ))}
        </Row>
        <T x size={12} center>
          8 of 10 — two more and it’s −100
        </T>
      </HP>

      <HP n={7} title="Your partner" color="#3b6fd0">
        <T size={14}>Each partner plays differently. Pick the one that fits your hand.</T>
        {PARTNERS.map((p) => (
          <View key={p.id}>
            <Divider />
            <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
              <Frame stem={p.portrait} size={44} />
              <T size={12} style={{ flex: 1 }}>
                <T x size={14}>
                  {p.name}
                </T>{' '}
                — {p.quirk}
                {'\n'}
                <T x size={12} color={pal.ok}>
                  Good if…{' '}
                </T>
                {stripLead(p.goodWith)}
                {'\n'}
                <T x size={12} color={pal.bad}>
                  Watch out…{' '}
                </T>
                {stripLead(p.watchOut)}
              </T>
            </View>
          </View>
        ))}
      </HP>

      <HP n={8} title="Items" color="#b83a6c">
        <T size={14}>
          Buy items in the Shed with Coins and equip one on a partner. Each adds <T x>+1 to a stat or two</T>, shown as ◆, and shows on their portrait.
        </T>
        <Row>
          {ITEMS.map((it) => (
            <View key={it.id} style={{ width: 56, alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 6, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Pix uri={IMAGES[`i-${it.id}`]} size={24} />
              </View>
              <T x size={10} center>
                {it.name}
              </T>
            </View>
          ))}
        </Row>
        <HNote>
          Some items are just silly — a Clown Nose, a Fake Mustache, a Rubber Chicken — but they still count. The Lucky Clover adds +1 to a partner’s lowest stat — same every game, no dice. The Cheater’s Mirror (1000 Coins) lets you peek at every hand once — then it’s gone.
        </HNote>
      </HP>

      <HP n={9} title="Rank and Coins" color="#8a6a1a">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Win', '+100 XP', '+20', pal.ok],
            ['Lose', '+25 XP', '+5', pal.bad],
            ['Zero, won none', '+50 XP', '+10', COLORS.ink],
          ].map(([h, xp, coins, col]) => (
            <View key={h} style={{ flex: 1, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 8, padding: 6, backgroundColor: '#fffdf5', alignItems: 'center' }}>
              <T x size={11} color={col} center>
                {h}
              </T>
              <T size={11}>{xp}</T>
              <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                <Coin size={14} />
                <T size={11}>{coins}</T>
              </View>
            </View>
          ))}
        </View>
        <T size={12}>Every 100 XP is a new rank. Coins buy partners and items — earned by playing only.</T>
      </HP>

      <HP bg={COLORS.sun}>
        <T x size={15}>
          Know Spades?
        </T>
        <T size={13}>bid = promise • trick = round • trump = spades beat everything • bag = extra • nil = go zero</T>
      </HP>

      <BtnP label="TRY THE TUTORIAL" size={11} onPress={() => router.push('/tutorial')} />
      <BtnS label="Play a Game" onPress={() => router.push('/pick')} />
    </Screen>
  );
}
