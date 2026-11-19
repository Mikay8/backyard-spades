// The Game Table — brief §12.3. Promise → 13 rounds → deal score → result.
// AI turns are paced one at a time so the player sees who played what.
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PromisePicker } from '../components/PromisePicker';
import { Btn, CardBack, PlayingCard, Portrait, PromiseDots, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { OPPONENTS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';
import {
  LEFT,
  PARTNER,
  RIGHT,
  YOU,
  legalForTurn,
  nextDeal,
  playAiTurn,
  playCard,
  setPlayerPromise,
  teamPromise,
  teamWon,
} from '../engine/game';
import { SUIT_NAME, sortHand } from '../engine/cards';

const AI_DELAY_MS = 700;

export default function Game() {
  const { game, setGame, finishGame, rank } = useApp();
  const [hint, setHint] = useState<string | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const finishedRef = useRef(false);
  const lastRoundRef = useRef<string | null>(null);

  // Game over → award Coins/XP once, then go to the result screen.
  useEffect(() => {
    if (game && game.phase === 'gameOver' && !finishedRef.current) {
      finishedRef.current = true;
      finishGame(game);
      router.replace('/result');
    }
  }, [game, finishGame]);

  // Show the won round briefly after each round completes.
  useEffect(() => {
    if (!game) return;
    const key = game.lastRoundPlays.length > 0 ? `${game.dealNumber}-${game.wonRounds.join('')}` : null;
    if (key && key !== lastRoundRef.current) {
      lastRoundRef.current = key;
      const winner = game.lastRoundWinner;
      setRoundBanner(
        winner === YOU
          ? 'You took the round.'
          : winner === PARTNER
            ? `${partnerById(game.partnerId).name.split(' ')[0]} took the round.`
            : 'They took the round.',
      );
      const t = setTimeout(() => setRoundBanner(null), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [game]);

  // AI turns, one at a time, paused while the round banner is showing.
  useEffect(() => {
    if (!game || game.phase !== 'play' || game.turnSeat === YOU || roundBanner) return undefined;
    const t = setTimeout(() => {
      setGame(playAiTurn(game));
    }, AI_DELAY_MS);
    return () => clearTimeout(t);
  }, [game, roundBanner, setGame]);

  if (!game) {
    return (
      <View style={[styles.screen, { justifyContent: 'center' }]}>
        <Text style={styles.body}>No game in progress.</Text>
        <Btn label="Back to Home" primary onPress={() => router.replace('/')} />
      </View>
    );
  }

  const partner = partnerById(game.partnerId);
  const myHand = sortHand(game.hands[YOU]);
  const ledSuit = game.currentPlays.length > 0 ? game.currentPlays[0].card.suit : null;
  const legal = game.phase === 'play' && game.turnSeat === YOU ? legalForTurn(game) : [];
  const isLegal = (c: { suit: string; rank: number }) =>
    legal.some((l) => l.suit === c.suit && l.rank === c.rank);
  const centrePlays = roundBanner && game.lastRoundPlays.length > 0 ? game.lastRoundPlays : game.currentPlays;
  const spadesOpen = game.spadesBroken;
  const partnerMood =
    game.lastRoundWinner === PARTNER || game.lastRoundWinner === YOU ? 'happy' : 'neutral';

  const onTapCard = (card: { suit: 'S' | 'H' | 'D' | 'C'; rank: number }) => {
    if (game.phase !== 'play' || game.turnSeat !== YOU) return;
    if (!isLegal(card)) {
      if (ledSuit && game.hands[YOU].some((c) => c.suit === ledSuit)) {
        setHint(`You have a ${SUIT_NAME[ledSuit]} — play a ${SUIT_NAME[ledSuit]} first.`);
      } else if (ledSuit === null && card.suit === 'S' && !spadesOpen) {
        setHint("You can't start with a spade yet — no spade has been played.");
      } else {
        setHint('That card can’t be played right now.');
      }
      return;
    }
    setHint(null);
    setGame(playCard(game, YOU, card));
  };

  const seatLabel = (seat: number): string =>
    seat === YOU ? 'You' : seat === PARTNER ? partner.name.split(' ')[0] : OPPONENTS[seat === LEFT ? 0 : 1].name;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.inner, { maxWidth: 560 }]}>
        {/* Top bar: game score, deal, pause */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink }}>
            You {game.scores.us} • Them {game.scores.them}
          </Text>
          <Text style={styles.small}>Deal {game.dealNumber} • First to 500</Text>
          <Pressable onPress={() => setShowPause(true)} accessibilityRole="button" accessibilityLabel="Pause">
            <Text style={{ fontSize: 22 }}>⏸</Text>
          </Pressable>
        </View>
        <View style={{ height: 8, backgroundColor: '#EDE6D2', borderRadius: 4, marginTop: 6 }}>
          <View
            style={{
              height: 8,
              width: `${Math.min(100, Math.max(0, game.scores.us) / 5)}%`,
              backgroundColor: COLORS.grass,
              borderRadius: 4,
            }}
          />
        </View>

        {/* Opponents */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          {[LEFT, RIGHT].map((seat) => {
            const opp = OPPONENTS[seat === LEFT ? 0 : 1];
            return (
              <View key={seat} style={{ alignItems: 'center', flex: 1 }}>
                <Portrait stem={opp.portrait} size={44} />
                <Text style={{ fontWeight: '700', color: COLORS.ink }}>{opp.name}</Text>
                <PromiseDots promised={game.promises[seat] ?? 0} won={game.wonRounds[seat]} />
                <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
                  <CardBack small />
                  <Text style={[styles.small, { marginLeft: 4 }]}>{game.hands[seat].length} left</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Partner */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Portrait stem={partner.portrait} size={56} mood={partnerMood} />
          <Text style={{ fontWeight: '800', color: COLORS.ink }}>
            {partner.name} — your partner
          </Text>
          <PromiseDots promised={game.promises[PARTNER] ?? 0} won={game.wonRounds[PARTNER]} />
          <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
            <CardBack small />
            <Text style={[styles.small, { marginLeft: 4 }]}>{game.hands[PARTNER].length} left</Text>
          </View>
        </View>

        {/* Centre: the table */}
        <View
          style={{
            backgroundColor: COLORS.grass,
            borderRadius: 16,
            padding: 12,
            marginTop: 12,
            minHeight: 110,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centrePlays.length === 0 ? (
            <Text style={{ color: '#EAF3EC', fontWeight: '700' }}>
              {game.phase === 'promise'
                ? 'Make your promise to start the deal.'
                : game.turnSeat === YOU
                  ? 'Your turn — play a card.'
                  : `${seatLabel(game.turnSeat)} is thinking…`}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {centrePlays.map((p) => (
                <View key={`${p.seat}-${p.card.suit}${p.card.rank}`} style={{ alignItems: 'center', margin: 4 }}>
                  <PlayingCard card={p.card} highlighted={game.lastRoundWinner === p.seat && !!roundBanner} />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{seatLabel(p.seat)}</Text>
                </View>
              ))}
            </View>
          )}
          {roundBanner ? (
            <Text style={{ color: '#fff', fontWeight: '800', marginTop: 6 }}>{roundBanner}</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={styles.small}>
            {spadesOpen ? 'Spades are open now.' : 'No spade has been played yet.'}
          </Text>
          <Text style={styles.small}>Spades beat everything.</Text>
        </View>

        {/* Your zone */}
        <View style={{ marginTop: 10 }}>
          <PromiseDots label="You" promised={game.promises[YOU] ?? 0} won={game.wonRounds[YOU]} />
          <Text style={styles.small}>
            Team: promised {teamPromise(game, 'us')} • won {teamWon(game, 'us')} — They promised{' '}
            {teamPromise(game, 'them')} • won {teamWon(game, 'them')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          {myHand.map((c) => (
            <PlayingCard
              key={`${c.suit}${c.rank}`}
              card={c}
              large={false}
              dimmed={game.phase === 'play' && game.turnSeat === YOU && !isLegal(c)}
              highlighted={false}
              onPress={() => onTapCard(c)}
              disabled={game.phase !== 'play' || game.turnSeat !== YOU}
            />
          ))}
        </View>
        {hint ? (
          <Text style={[styles.body, { marginTop: 8, color: COLORS.accent, fontWeight: '700' }]}>{hint}</Text>
        ) : null}
        {game.phase === 'play' && game.turnSeat === YOU ? (
          <Text style={[styles.body, { marginTop: 6 }]}>Your turn — play a card.</Text>
        ) : null}

        {/* Promise phase */}
        {game.phase === 'promise' ? (
          <PromisePicker
            hand={myHand}
            partnerPromise={game.promises[PARTNER]}
            partnerName={partner.name.split(' ')[0]}
            seePartnerPromise={game.seePartnerPromise}
            opponentPromises={[
              { name: OPPONENTS[0].name, promise: game.promises[LEFT] ?? 0 },
              { name: OPPONENTS[1].name, promise: game.promises[RIGHT] ?? 0 },
            ]}
            onConfirm={(n) => {
              // The AI-turn effect below paces the opponents one at a time.
              setGame(setPlayerPromise(game, n));
            }}
          />
        ) : null}

        {/* Deal-score sheet */}
        {game.phase === 'dealScore' && game.lastDeal ? (
          <View style={[styles.card, { marginTop: 14, borderWidth: 2, borderColor: COLORS.grass }]}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: COLORS.ink }}>
              Deal {game.lastDeal.deal} done
            </Text>
            <Text style={styles.body}>
              You promised {game.lastDeal.usPromise}, won {game.lastDeal.usWon} —{' '}
              {game.lastDeal.usPoints >= 0 ? '+' : ''}
              {game.lastDeal.usPoints}
            </Text>
            <Text style={styles.body}>
              They promised {game.lastDeal.themPromise}, won {game.lastDeal.themWon} —{' '}
              {game.lastDeal.themPoints >= 0 ? '+' : ''}
              {game.lastDeal.themPoints}
            </Text>
            {game.lastDeal.usExtras > 0 ? (
              <Text style={styles.body}>
                Extras: {game.lastDeal.usExtras} this deal, {game.extrasBank.us} banked —{' '}
                {10 - game.extrasBank.us} more and it&rsquo;s -100.
              </Text>
            ) : null}
            {game.lastDeal.goZeroDeltaUs !== 0 ? (
              <Text style={styles.body}>
                Go zero: {game.lastDeal.goZeroDeltaUs > 0 ? '+100' : '-100'}.
              </Text>
            ) : null}
            <Text style={[styles.body, { marginTop: 6, fontWeight: '800' }]}>
              Game: You {game.scores.us} • Them {game.scores.them} — first to 500.
            </Text>
            <Btn
              label="Next Deal"
              primary
              onPress={() => setGame(nextDeal(game))}
              testID="next-deal"
            />
          </View>
        ) : null}

        {/* Pause / quit sheet */}
        {showPause ? (
          <View style={[styles.card, { marginTop: 14, borderWidth: 2, borderColor: COLORS.ink }]}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: COLORS.ink }}>Paused</Text>
            <Btn label="Resume" primary onPress={() => setShowPause(false)} />
            <Btn label="How to Play" onPress={() => { setShowPause(false); router.push('/howto'); }} />
            {!confirmQuit ? (
              <Btn label="Quit Game" onPress={() => setConfirmQuit(true)} />
            ) : (
              <View>
                <Text style={styles.body}>Quit this game? You won&rsquo;t earn Coins or XP for it.</Text>
                <Btn label="Keep Playing" onPress={() => setConfirmQuit(false)} />
                <Btn
                  label="Quit — back to Home"
                  primary
                  onPress={() => {
                    setGame(null);
                    router.replace('/');
                  }}
                />
              </View>
            )}
          </View>
        ) : null}
        <Text style={[styles.small, { marginTop: 8 }]}>Rank {rank} — playing with {partner.name}.</Text>
      </View>
    </ScrollView>
  );
}
