// The Game Table — design canvas. Score bar, partner across, the backyard
// table with both opponents and the cards in play, rule pills, a status
// coach line, your fanned hand and your promise panel. Sheets: promise,
// deal score, pause, quit, peek (Cheater's Mirror).
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { PromisePicker } from '../components/PromisePicker';
import { Coach, Hand, PartnerRow, TableScene, TopBar, YouPanel, seatInfo } from '../components/Table';
import { InkLine } from '../components/sheets';
import { Bar, BtnP, BtnS, MiniCard, Pill, Pix, Screen, Sheet, T } from '../components/ui';
import { IMAGES } from '../assets/images';
import { partnerById } from '../constants/partners';
import { partnerFirstName } from '../constants/items';
import { useApp } from '../state/store';
import { LEFT, PARTNER, RIGHT, YOU, legalForTurn, nextDeal, playAiTurn, playCard, setPlayerPromise } from '../engine/game';
import { SUIT_NAME, sortHand, type Card } from '../engine/cards';

const AI_DELAY_MS = 700;
const fmt = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export default function Game() {
  const { game, setGame, finishGame, profile, settings, spendMirror } = useApp();
  const [hint, setHint] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | 'pause' | 'quit' | 'peek'>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const finishedRef = useRef(false);
  const lastRoundRef = useRef<string | null>(null);

  // Show the won round briefly after each round completes.
  useEffect(() => {
    if (!game) return undefined;
    const key = game.lastRoundPlays.length > 0 ? `${game.dealNumber}-${game.wonRounds.join('')}` : null;
    if (key && key !== lastRoundRef.current) {
      lastRoundRef.current = key;
      const w = game.lastRoundWinner;
      setBanner(w === YOU ? 'You took the round.' : w === PARTNER ? `${partnerFirstName(game.partnerId)} takes it.` : 'They took the round.');
      const t = setTimeout(() => setBanner(null), settings.reducedMotion ? 700 : 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [game, settings.reducedMotion]);

  // AI turns, one at a time, paused while the round banner or a sheet shows.
  useEffect(() => {
    if (!game || game.phase !== 'play' || game.turnSeat === YOU || banner || sheet) return undefined;
    const t = setTimeout(() => setGame(playAiTurn(game)), AI_DELAY_MS);
    return () => clearTimeout(t);
  }, [game, banner, sheet, setGame]);

  useEffect(() => {
    if (!hint) return undefined;
    const t = setTimeout(() => setHint(null), 2200);
    return () => clearTimeout(t);
  }, [hint]);

  if (!game) {
    return (
      <Screen contentStyle={{ paddingTop: 40, gap: 12 }}>
        <T x size={15}>
          No game in progress.
        </T>
        <BtnP label="BACK TO HOME" size={12} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const partner = partnerById(game.partnerId);
  const first = partnerFirstName(partner.id);
  const myHand = sortHand(game.hands[YOU]);
  const myTurn = game.phase === 'play' && game.turnSeat === YOU && !banner;
  const legal = myTurn ? legalForTurn(game) : [];
  const isLegal = (c: Card) => (myTurn ? legal.some((l) => l.suit === c.suit && l.rank === c.rank) : null);
  const ledSuit = game.currentPlays.length > 0 ? game.currentPlays[0].card.suit : null;
  const plays = banner && game.lastRoundPlays.length > 0 ? game.lastRoundPlays : game.currentPlays;
  const winnerSeat = banner ? game.lastRoundWinner : null;
  const dealDone = game.phase === 'dealScore' || game.phase === 'gameOver';
  const thinking = (s: number) => game.phase === 'play' && !banner && game.turnSeat === s;
  const d = game.lastDeal;
  const usMade = d ? d.usWon >= d.usPromise : false;
  const partnerMood: 'happy' | 'neutral' | 'wince' = dealDone && d ? (usMade ? 'happy' : 'wince') : winnerSeat === PARTNER || winnerSeat === YOU ? 'happy' : 'neutral';
  const roundsPlayed = game.wonRounds.reduce((a, b) => a + b, 0);
  const canPeek = profile.mirror > 0 && game.phase === 'play' && !banner;

  const onTapCard = (card: Card) => {
    if (!myTurn) return;
    if (!isLegal(card)) {
      if (ledSuit && game.hands[YOU].some((c) => c.suit === ledSuit)) {
        setHint(`You have a ${SUIT_NAME[ledSuit].slice(0, -1)} — play a ${SUIT_NAME[ledSuit].slice(0, -1)} first.`);
      } else if (ledSuit === null && card.suit === 'S' && !game.spadesBroken) {
        setHint('You can’t start with a spade yet — no spade has been played.');
      } else {
        setHint('That card can’t be played right now.');
      }
      return;
    }
    setHint(null);
    setGame(playCard(game, YOU, card));
  };

  const seatName = (s: number) => (s === YOU ? 'You' : s === LEFT ? 'Left' : s === PARTNER ? first : 'Right');
  let status = '';
  if (game.phase === 'promise') status = 'Make your promise';
  else if (banner) status = banner;
  else if (dealDone) status = `Deal ${game.dealNumber} done`;
  else if (game.turnSeat === YOU) status = game.currentPlays.length === 0 ? 'You start the round — play a card' : 'Your turn — play a card';
  else status = `${seatName(game.turnSeat)} is thinking…`;
  if (hint) status = hint;

  const seeResult = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    finishGame(game);
    router.replace('/result');
  };

  return (
    <Screen
      scroll={false}
      overlay={
        <>
          {/* Deal score */}
          <Sheet visible={dealDone && !!d}>
            {d ? (
              <>
                <T px size={14} accessibilityRole="header">
                  Deal {d.deal} done
                </T>
                <T x size={17}>
                  You promised {d.usPromise}, won {d.usWon} — {fmt(d.usPoints)}
                </T>
                {!usMade ? <T size={13}>Missed by {d.usPromise - d.usWon} — so close.</T> : null}
                <T x size={17}>
                  They promised {d.themPromise}, won {d.themWon} — {fmt(d.themPoints)}
                </T>
                {d.usExtras > 0 || game.extrasBank.us > 0 ? (
                  <T size={13}>
                    Extras: {d.usExtras} this deal, {game.extrasBank.us} total — {10 - game.extrasBank.us} more and it’s −100.
                  </T>
                ) : null}
                {d.goZeroDeltaUs !== 0 ? <T size={13}>Go zero: {d.goZeroDeltaUs > 0 ? '+100' : '−100'}.</T> : null}
                {d.goZeroDeltaThem !== 0 ? <T size={13}>The other side went zero: {d.goZeroDeltaThem > 0 ? '+100' : '−100'}.</T> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T x size={12}>
                    You {game.scores.us}
                  </T>
                  <T x size={12}>
                    Them {game.scores.them}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Bar pct={game.scores.us / 5} style={{ flex: 1 }} />
                  <Bar pct={game.scores.them / 5} kind="them" style={{ flex: 1 }} />
                </View>
                {game.phase === 'gameOver' ? (
                  <T x size={14}>
                    {game.winner === 'us' ? 'You reached 500.' : game.scores.them >= 500 ? 'They reached 500.' : 'You fell to −200.'}
                  </T>
                ) : null}
                {game.phase === 'gameOver' ? (
                  <BtnP label="SEE RESULT" size={13} onPress={seeResult} testID="see-result" />
                ) : (
                  <BtnP label="NEXT DEAL" size={13} onPress={() => setGame(nextDeal(game))} testID="next-deal" />
                )}
              </>
            ) : null}
          </Sheet>

          {/* Pause */}
          <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)}>
            <T px size={14}>
              PAUSED
            </T>
            <BtnP label="RESUME" onPress={() => setSheet(null)} />
            <BtnS
              label="How to Play"
              onPress={() => {
                setSheet(null);
                router.push('/howto');
              }}
            />
            <BtnS label="Quit Game" onPress={() => setSheet('quit')} />
          </Sheet>

          {/* Quit */}
          <Sheet visible={sheet === 'quit'} onClose={() => setSheet('pause')}>
            <T x size={18}>
              Quit this game?
            </T>
            <T size={14}>You won’t earn Coins or XP for it.</T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <BtnS label="Cancel" onPress={() => setSheet('pause')} />
              </View>
              <View style={{ flex: 1 }}>
                <BtnS
                  label="Quit"
                  danger
                  onPress={() => {
                    setSheet(null);
                    setGame(null);
                    router.replace('/');
                  }}
                />
              </View>
            </View>
          </Sheet>

          {/* Peek */}
          <Sheet visible={sheet === 'peek'} onClose={() => setSheet(null)}>
            <T x size={18}>
              Everyone’s cards
            </T>
            <T size={12}>Your Cheater’s Mirror is used up after this look.</T>
            {[LEFT, PARTNER, RIGHT].map((s) => (
              <View key={s}>
                <T x size={12} style={{ marginBottom: 3 }}>
                  {s === PARTNER ? partner.name : seatName(s)}
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                  {sortHand(game.hands[s]).map((c) => (
                    <MiniCard key={`${c.suit}${c.rank}`} card={c} tiny />
                  ))}
                </View>
              </View>
            ))}
            <InkLine />
            <BtnP label="BACK TO THE GAME" size={12} onPress={() => setSheet(null)} />
          </Sheet>
        </>
      }
    >
      <TopBar us={game.scores.us} them={game.scores.them} deal={game.dealNumber} onPause={() => setSheet('pause')} />
      <PartnerRow
        name={partner.name}
        stem={partner.portrait}
        mood={partnerMood}
        item={profile.equip[partner.id]}
        info={seatInfo(game.promises[PARTNER], game.wonRounds[PARTNER], game.hands[PARTNER].length, thinking(PARTNER), game.phase === 'promise' && !game.seePartnerPromise)}
      />

      <View style={{ position: 'relative' }}>
        <TableScene
          left={seatInfo(game.promises[LEFT], game.wonRounds[LEFT], game.hands[LEFT].length, thinking(LEFT))}
          right={seatInfo(game.promises[RIGHT], game.wonRounds[RIGHT], game.hands[RIGHT].length, thinking(RIGHT))}
          plays={plays}
          winnerSeat={winnerSeat}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center', paddingVertical: 4, flexWrap: 'wrap' }}>
          {profile.gamesPlayed < 3 ? <Pill label="Spades beat everything" /> : null}
          <Pill label={game.spadesBroken ? 'Spades are open now' : 'No spade has been played yet'} open={game.spadesBroken} />
          {canPeek ? (
            <BtnS onPress={() => { spendMirror(); setSheet('peek'); }} style={{ minHeight: 36, paddingVertical: 2, paddingHorizontal: 8, marginBottom: 0 }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Pix uri={IMAGES['i-mirror']} size={18} />
                <T x size={12}>
                  Peek ({profile.mirror})
                </T>
              </View>
            </BtnS>
          ) : null}
        </View>
        <Coach text={status} />

        {game.phase === 'promise' ? (
          <View style={{ position: 'absolute', left: 12, right: 12, bottom: 0 }}>
            <PromisePicker
              hand={myHand}
              partnerPromise={game.promises[PARTNER]}
              partnerName={first}
              seePartnerPromise={game.seePartnerPromise}
              opponentPromises={[
                { name: 'Left', promise: game.promises[LEFT] ?? 0 },
                { name: 'Right', promise: game.promises[RIGHT] ?? 0 },
              ]}
              onConfirm={(n) => setGame(setPlayerPromise(game, n))}
            />
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 12, gap: 6 }}>
        <Hand cards={myHand} large={settings.cardSize === 'large'} isLegal={isLegal} onTap={onTapCard} />
        <YouPanel
          info={seatInfo(game.promises[YOU], game.wonRounds[YOU], game.hands[YOU].length, false)}
          roundsLeft={Math.max(0, 13 - roundsPlayed)}
        />
      </View>
    </Screen>
  );
}
