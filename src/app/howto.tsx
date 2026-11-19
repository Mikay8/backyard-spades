// How to Play — brief §12.7. Full reference in plain language.
// The "Know Spades?" box at the bottom is the ONLY place the old Spades
// words (bid / trick / trump / bag / nil) may appear.
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Btn, Portrait, styles, Wordmark } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS } from '../constants/partners';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={{ marginTop: 18 }}>
    <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>{title}</Text>
    <View style={{ marginTop: 6 }}>{children}</View>
  </View>
);

export default function HowToPlay() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>How to Play</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={{ fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 10 }}>
          <Wordmark size={36} />
        </View>

        <Section title="The goal">
          <Text style={styles.body}>
            You and your partner try to win the rounds you promised. First team to 500 wins the game.
          </Text>
        </Section>

        <Section title="The table">
          <Text style={styles.body}>
            You sit at the bottom, your partner across from you, and the other side on your left and right.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Portrait stem="p-nbrL" size={40} />
              <Text style={styles.small}>Left — the other side</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Portrait stem="grandma" size={48} />
              <Text style={styles.small}>Grandma Rose — your partner</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Portrait stem="p-nbrR" size={40} />
              <Text style={styles.small}>Right — the other side</Text>
            </View>
          </View>
          <Text style={[styles.body, { marginTop: 8 }]}>You are at the bottom. Everyone gets 13 cards.</Text>
        </Section>

        <Section title="Promise">
          <Text style={styles.body}>
            Before each deal, promise how many rounds you think you’ll win — 0 to 13. Count your likely
            winners: aces, and high spades. Your partner promises too, and together your promises are
            your team promise.
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>
            Go zero means promising 0: win zero rounds and it’s +100. Win even one round and it’s -100.
            Only try it when your hand is weak.
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>
            Example: you promise 3 and Grandma promises 4. Together you promised 7.
          </Text>
        </Section>

        <Section title="A round">
          <Text style={styles.body}>
            One player starts a round by playing a card. Everyone else must play the same suit if they
            have it. The highest card of that suit wins the round — unless someone played a spade.
            Spades beat everything: even the smallest spade beats the biggest card of any other suit.
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>
            You can’t start a round with a spade until a spade has been played — unless spades are all
            you have left.
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>
            Example: Left plays the King of diamonds. You play the Queen of diamonds. Grandma plays the
            9 of diamonds. Right has no diamonds, so she plays a spade. Right wins the round, because
            spades beat everything — even a King.
          </Text>
        </Section>

        <Section title="Scoring">
          <Text style={styles.body}>Each deal is scored like this:</Text>
          <Text style={[styles.body, { marginTop: 6 }]}>• Made your promise: 10 points per promised round, +1 per extra round over your promise.</Text>
          <Text style={styles.body}>• Missed your promise: minus 10 points per promised round. The rounds you won score nothing.</Text>
          <Text style={styles.body}>• Go zero and won none: +100. Go zero and won one or more: -100.</Text>
          <Text style={styles.body}>• Every 10 extras your team collects across deals: -100.</Text>
          <Text style={[styles.body, { marginTop: 8, fontWeight: '700' }]}>Worked examples:</Text>
          <Text style={styles.body}>Promised 7, won 7 → 70 points.</Text>
          <Text style={styles.body}>Promised 9, won 10 → 90 + 1 = 91 points.</Text>
          <Text style={styles.body}>Promised 8, won 6 → -80 points.</Text>
          <Text style={styles.body}>June went zero and won none, team made 6 → 60 + 100 = 160 points.</Text>
          <Text style={styles.body}>8 extras banked, then 3 more → -100 now, 1 extra carries over.</Text>
          <Text style={[styles.body, { marginTop: 6 }]}>First team to 500 wins the game. A team at -200 loses.</Text>
        </Section>

        <Section title="Extras">
          <Text style={styles.body}>
            Extras are the rounds you win over your promise. One extra is worth 1 point — but every 10th
            extra costs your team 100 points. Winning by a little is safer than winning by a lot.
          </Text>
        </Section>

        <Section title="Your partner">
          {PARTNERS.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', marginTop: 8, alignItems: 'flex-start' }}>
              <Portrait stem={p.portrait} size={36} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontWeight: '800', color: COLORS.ink }}>
                  {p.name} — {p.role}
                </Text>
                <Text style={styles.small}>{p.quirk}</Text>
                <Text style={styles.small}>{p.goodWith}</Text>
                <Text style={styles.small}>{p.watchOut}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Rank + Coins">
          <Text style={styles.body}>
            Win a game: +100 XP and +20 Coins. Lose a game: +25 XP and +5 Coins. Win a game where you
            went zero and won zero rounds: +50 XP and +10 Coins extra. Your rank is 1 + your XP divided
            by 100. Higher ranks unlock the rest of the family to buy with Coins. You start with 25 Coins.
          </Text>
        </Section>

        <Section title="Know Spades?">
          <View style={[styles.card, { backgroundColor: '#F5EFE0' }]}>
            <Text style={styles.body}>
              Here’s what we call things in this game: a bid is a promise, a trick is a round, trump
              means spades beat everything, a bag is an extra, and nil is go zero.
            </Text>
          </View>
        </Section>

        <Btn label="Try the Interactive Tutorial" primary onPress={() => router.push('/tutorial')} />
        <Btn label="Play a Game" onPress={() => router.push('/pick')} />
        <Btn label="Close" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
