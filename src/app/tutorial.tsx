// Interactive Tutorial — brief §13, Steps 1–10. A guided practice game with
// the FIXED example deal. Grandma Rose is the teacher. Practice only — no
// Coins or XP are saved.
//
// Script corrections vs the brief's first draft (all are rule errors in the
// brief, fixed here and flagged in the build report):
//  - Step 5: the brief has Left lead the King of diamonds AND Grandma play
//    the King of diamonds — one card can't be in two hands. Left holds no
//    King of diamonds at all; Grandma does, and Grandma won round 4, so
//    Grandma leads the King of diamonds. Left follows with the 3 of
//    diamonds, Right plays a spade, you play your Queen. The lesson
//    ("Spades beat everything") is unchanged.
//  - Step 5: Right plays the 3 of spades, not the 2 — the 2 of spades is
//    Left's card; Right's lowest spade is the 3.
//  - Step 7: Left leads the 7 of spades. The brief says "Right leads the Ace
//    of diamonds", but Right holds no diamonds at all, and you still hold the
//    7 and 6 of diamonds — so that lead is impossible. Left won round 6, so
//    Left leads; a spade lead is legal (spades are open since Step 5) and
//    keeps the payoff: your Ace of spades wins the round.
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PromisePicker } from '../components/PromisePicker';
import { Btn, PlayingCard, Portrait, PromiseDots, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { useApp } from '../state/store';
import { chooseCard } from '../engine/ai';
import { rankLabel, roundWinner, sortHand, type Card, type Play } from '../engine/cards';
import { TUTORIAL_HANDS, LEFT, PARTNER, RIGHT, YOU } from '../engine/game';
import { scoreDeal } from '../engine/scoring';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Short code for a card, e.g. 'QH', 'AS', '10D'. */
const shortId = (c: Card): string => `${rankLabel(c.rank)}${c.suit}`;

const SEAT_NAME: Record<number, string> = {
  [YOU]: 'You',
  [LEFT]: 'Left',
  [PARTNER]: 'Grandma Rose',
  [RIGHT]: 'Right',
};

export default function Tutorial() {
  const { markTutorialDone } = useApp();
  const [step, setStep] = useState(1);
  const [coach, setCoach] = useState(
    'This is Spades with a partner. You and Grandma Rose are one team. The other side is the other team.',
  );
  const [plays, setPlays] = useState<Play[]>([]);
  const [won, setWon] = useState({ us: 0, them: 0 });
  const [awaitCard, setAwaitCard] = useState<string | null>(null);
  const [tryCard, setTryCard] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPromise, setShowPromise] = useState(false);
  const [teamPromise, setTeamPromise] = useState(0);
  const [dealResult, setDealResult] = useState<{ usWon: number; usPoints: number; themPoints: number } | null>(null);
  const handsRef = useRef<Card[][]>(TUTORIAL_HANDS.map((h) => [...h]));
  // Mirror of handsRef in state, so render reads state (never a ref).
  const [handsState, setHandsState] = useState<Card[][]>(TUTORIAL_HANDS.map((h) => [...h]));
  const playsRef = useRef<Play[]>([]);
  const wonRef = useRef({ us: 0, them: 0 });
  const spadesBrokenRef = useRef(false);
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const setPlaysBoth = (p: Play[]) => {
    playsRef.current = p;
    setPlays(p);
  };

  const removeFromHand = (seat: number, card: Card) => {
    handsRef.current[seat] = handsRef.current[seat].filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank),
    );
    setHandsState(handsRef.current.map((h) => [...h]));
  };

  const playOne = async (seat: number, card: Card): Promise<Play[]> => {
    removeFromHand(seat, card);
    if (card.suit === 'S') spadesBrokenRef.current = true;
    const next = [...playsRef.current, { seat, card }];
    setPlaysBoth(next);
    bump();
    await sleep(650);
    return next;
  };

  /** Play a scripted sequence onto the current plays, then resolve the round. */
  const playSequence = async (seq: { seat: number; card: Card }[], onDone: (winner: number) => void) => {
    setBusy(true);
    for (const p of seq) {
      await playOne(p.seat, p.card);
    }
    const winner = roundWinner(playsRef.current);
    if (winner === YOU || winner === PARTNER) {
      wonRef.current = { ...wonRef.current, us: wonRef.current.us + 1 };
    } else {
      wonRef.current = { ...wonRef.current, them: wonRef.current.them + 1 };
    }
    setWon({ ...wonRef.current });
    setBusy(false);
    onDone(winner);
  };

  const card = (code: string): Card => {
    const found =
      handsRef.current.flat().find((c) => shortId(c) === code) ??
      TUTORIAL_HANDS.flat().find((c) => shortId(c) === code);
    if (!found) throw new Error(`tutorial card not found: ${code}`);
    return found;
  };

  const clearPlays = () => setPlaysBoth([]);

  // ---- Step 5: Grandma leads (she won round 4), then you play ------------
  const beginStep5 = async () => {
    clearPlays();
    setStep(5);
    setCoach('Grandma led the King of diamonds. You have diamonds — play one. Try your Queen.');
    setBusy(true);
    await playOne(PARTNER, card('KD'));
    await playOne(LEFT, card('3D'));
    setBusy(false);
    setAwaitCard('QD');
  };

  // ---- Step 7: Left leads a spade, then you play --------------------------
  const beginStep7 = async () => {
    clearPlays();
    setStep(7);
    setCoach('Left played the 7 of spades. You have spades — play your Ace of spades to win this round.');
    setBusy(true);
    await playOne(LEFT, card('7S'));
    setBusy(false);
    setAwaitCard('AS');
  };

  // ---- Step 8: fast-forward the rest of the deal --------------------------
  const fastForward = async () => {
    clearPlays();
    setStep(8);
    setCoach("Let's finish this deal fast.");
    setBusy(true);
    let leader = YOU; // you won round 7
    for (let round = 0; round < 9; round++) {
      for (let i = 0; i < 4; i++) {
        const seat = (leader + i) % 4;
        const hand = handsRef.current[seat];
        if (hand.length === 0) break;
        const current = playsRef.current;
        const ledSuit = current.length > 0 ? current[0].card.suit : null;
        const choice = chooseCard('balanced', {
          hand,
          ledSuit,
          plays: current,
          spadesBroken: spadesBrokenRef.current,
          mySeat: seat,
          partnerSeat: seat === YOU ? PARTNER : seat === PARTNER ? YOU : seat === LEFT ? RIGHT : LEFT,
          currentWinnerSeat: current.length > 0 ? roundWinner(current) : null,
          goingZero: false,
          teamMadePromise: false,
          roundsLeft: hand.length,
        });
        await playOne(seat, choice.card);
        await sleep(150);
      }
      if (playsRef.current.length === 0) break;
      const winner = roundWinner(playsRef.current);
      if (winner === YOU || winner === PARTNER) {
        wonRef.current = { ...wonRef.current, us: wonRef.current.us + 1 };
      } else {
        wonRef.current = { ...wonRef.current, them: wonRef.current.them + 1 };
      }
      setWon({ ...wonRef.current });
      setPlaysBoth([]);
      leader = winner;
    }
    const usScore = scoreDeal({
      teamPromise: 7,
      teamWon: wonRef.current.us,
      goZero: [],
      extrasBankBefore: 0,
    });
    const themScore = scoreDeal({
      teamPromise: 4,
      teamWon: wonRef.current.them,
      goZero: [],
      extrasBankBefore: 0,
    });
    setDealResult({ usWon: wonRef.current.us, usPoints: usScore.points, themPoints: themScore.points });
    setCoach(
      `You promised 7 and won ${wonRef.current.us}. That's ${7 * 10} points, plus ${usScore.extrasThisDeal} for the extra round${usScore.extrasThisDeal === 1 ? '' : 's'}. Extras are the rounds over your promise.`,
    );
    setBusy(false);
  };

  const finishTutorial = () => {
    markTutorialDone();
  };

  // Tap handling for the guided cards.
  const onTapCard = (c: Card) => {
    if (busy) return;
    const id = shortId(c);
    if (step === 4 && awaitCard === 'QH') {
      if (id !== 'QH') {
        setCoach('Try the Queen of hearts first.');
        return;
      }
      setAwaitCard(null);
      void playSequence(
        [
          { seat: YOU, card: c },
          { seat: PARTNER, card: card('AH') },
          { seat: LEFT, card: card('9H') },
          { seat: RIGHT, card: card('7H') },
        ],
        () => setCoach('Highest heart wins the round. Grandma’s Ace wins — your team takes the pile.'),
      );
      return;
    }
    if (step === 5 && awaitCard === 'QD') {
      if (id !== 'QD') {
        setCoach('Try your Queen of diamonds.');
        return;
      }
      setAwaitCard(null);
      void playSequence(
        [
          { seat: YOU, card: c },
          { seat: RIGHT, card: card('3S') },
        ],
        () =>
          setCoach(
            'Right had no diamonds, so they played a spade. Spades beat everything — even a King. Right takes the round. That’s why spades are strong. Save yours for when you need them.',
          ),
      );
      return;
    }
    if (step === 6) {
      if (tryCard === 'AS') {
        if (id !== 'AS') {
          setCoach('Try to play a spade first — tap your Ace of spades.');
          return;
        }
        setTryCard(null);
        setCoach(
          'Not yet — no spade has been played. You can’t start with a spade until one has been played. Play a club instead — try your 9 of clubs.',
        );
        setAwaitCard('9C');
        return;
      }
      if (awaitCard === '9C') {
        if (id !== '9C') {
          setCoach('Try your 9 of clubs.');
          return;
        }
        setAwaitCard(null);
        void playSequence(
          [
            { seat: YOU, card: c },
            { seat: PARTNER, card: card('QC') },
            { seat: LEFT, card: card('KC') },
            { seat: RIGHT, card: card('6C') },
          ],
          () => setCoach('Left’s King of clubs wins. No spades were played, so the highest club wins.'),
        );
        return;
      }
      return;
    }
    if (step === 7 && awaitCard === 'AS') {
      if (id !== 'AS') {
        setCoach('Play your Ace of spades to win this round.');
        return;
      }
      setAwaitCard(null);
      void playSequence(
        [
          { seat: YOU, card: c },
          { seat: PARTNER, card: card('5S') },
          { seat: RIGHT, card: card('8S') },
        ],
        () => setCoach('Your Ace of spades beats their 8. You take the round.'),
      );
    }
  };

  const myHand = sortHand(handsState[YOU]);
  const showHand = step >= 2;
  const highlight = (c: Card): boolean => {
    const id = shortId(c);
    if (step === 2) return id === 'AS' || id === 'KS';
    if (awaitCard) return id === awaitCard;
    if (tryCard) return id === tryCard;
    return false;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.inner}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>Tutorial</Text>
          <Text style={styles.small}>Step {step} of 10</Text>
        </View>
        <Text style={[styles.small, { marginTop: 4 }]}>Practice only — no Coins for this one.</Text>

        {/* The table */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Portrait stem="p-nbrL" size={40} />
            <Text style={{ fontWeight: '700', color: COLORS.ink }}>Left</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Portrait stem="grandma" size={48} />
            <Text style={{ fontWeight: '700', color: COLORS.ink }}>Grandma Rose</Text>
            <Text style={styles.small}>your partner</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Portrait stem="p-nbrR" size={40} />
            <Text style={{ fontWeight: '700', color: COLORS.ink }}>Right</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: COLORS.grass,
            borderRadius: 16,
            padding: 12,
            marginTop: 12,
            minHeight: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {plays.length === 0 ? (
            <Text style={{ color: '#EAF3EC', fontWeight: '700' }}>
              {step === 1 ? 'First to 500 wins.' : step === 10 ? 'That’s the whole game.' : 'The table is ready.'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {plays.map((p) => (
                <View key={`${p.seat}-${shortId(p.card)}`} style={{ alignItems: 'center', margin: 4 }}>
                  <PlayingCard card={p.card} />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{SEAT_NAME[p.seat]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {step >= 3 ? (
          <View style={{ marginTop: 10 }}>
            <PromiseDots label="Your team" promised={teamPromise} won={won.us} />
            <Text style={styles.small}>The other side has won {won.them} round{won.them === 1 ? '' : 's'}.</Text>
          </View>
        ) : null}

        {/* Your cards */}
        {showHand ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
            {myHand.map((c) => (
              <PlayingCard
                key={shortId(c)}
                card={c}
                highlighted={highlight(c)}
                onPress={() => onTapCard(c)}
                disabled={busy || (!awaitCard && !tryCard)}
              />
            ))}
          </View>
        ) : null}

        {/* Coach line — one line at a time */}
        <View style={[styles.card, { marginTop: 14, borderColor: COLORS.grass, borderWidth: 2 }]}>
          <Text style={[styles.body, { fontSize: 16 }]}>{coach}</Text>
        </View>

        {/* Step controls */}
        {step === 1 ? <Btn label="Got it" primary onPress={() => {
          setStep(2);
          setCoach('These are your cards. The big ones usually win a round. Your Ace and King of spades are strong — spades beat everything.');
        }} /> : null}
        {step === 2 ? <Btn label="Got it" primary onPress={() => {
          setStep(3);
          setCoach('How many rounds do you think you’ll win? Tap a number. With this hand, 3 is a good promise.');
          setShowPromise(true);
        }} /> : null}

        {step === 3 && showPromise ? (
          <PromisePicker
            hand={myHand}
            partnerPromise={4}
            partnerName="Grandma Rose"
            seePartnerPromise
            opponentPromises={[
              { name: 'Left', promise: 2 },
              { name: 'Right', promise: 2 },
            ]}
            suggested={3}
            onWrongTap={(n) => {
              if (n === 0) setCoach('0 means win zero rounds — not this time.');
              else if (n > 3) setCoach('5 is bold — try 3 first.');
              else setCoach('With this hand, 3 is a good promise.');
            }}
            onConfirm={(n) => {
              setShowPromise(false);
              setTeamPromise(7);
              setCoach('Grandma promised 4. Together you promised 7. That’s your team promise. You start. Play a card — try your Queen of hearts.');
              setStep(4);
              setAwaitCard('QH');
            }}
          />
        ) : null}

        {step === 4 && !busy && plays.length > 0 ? <Btn label="Got it" primary onPress={() => void beginStep5()} /> : null}
        {step === 5 && !busy && plays.length > 0 ? <Btn label="Got it" primary onPress={() => {
          setStep(6);
          setCoach('Your turn to start a round. Try to play a spade.');
          setTryCard('AS');
          clearPlays();
        }} /> : null}
        {step === 6 && !busy && plays.length > 0 ? <Btn label="Got it" primary onPress={() => void beginStep7()} /> : null}
        {step === 7 && !busy && plays.length > 0 ? <Btn label="Got it" primary onPress={() => void fastForward()} /> : null}

        {step === 8 && dealResult ? (
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>Deal done</Text>
            <Text style={styles.body}>
              You promised 7, won {dealResult.usWon} — +{dealResult.usPoints}
            </Text>
            <Btn label="Got it" primary onPress={() => {
              setStep(9);
              setCoach('One more idea: promise 0 and it’s called going zero. Win zero rounds and it’s +100. Win even one and it’s -100. Only try it when your hand is weak.');
            }} />
          </View>
        ) : null}

        {step === 9 ? (
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>Go zero — 0</Text>
            <Text style={styles.body}>Promise 0, win zero rounds: +100. Win even one: -100.</Text>
            <Btn label="Got it" primary onPress={() => {
              setStep(10);
              setCoach('That’s the whole game. Keep playing deals until one side reaches 500. Win the game and you earn Coins and climb in rank — and unlock the rest of the family.');
            }} />
          </View>
        ) : null}

        {step === 10 && dealResult ? (
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink }}>
              You {dealResult.usPoints} • Them {dealResult.themPoints}
            </Text>
            <Text style={styles.body}>First to 500 wins the game.</Text>
            <Btn
              label="Play a Real Game"
              primary
              onPress={() => {
                finishTutorial();
                router.push('/pick');
              }}
            />
            <Btn
              label="Back to Home"
              onPress={() => {
                finishTutorial();
                router.replace('/');
              }}
            />
          </View>
        ) : null}

        <Btn
          label="Leave tutorial"
          onPress={() => router.replace('/')}
        />
      </View>
    </ScrollView>
  );
}
