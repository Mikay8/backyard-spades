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
import { View, useWindowDimensions } from 'react-native';
import { PromisePicker } from '../components/PromisePicker';
import { Coach, Hand, PartnerRow, TableScene, TopBar, YouPanel, seatInfo } from '../components/Table';
import { BtnP, BtnS, Pill, Screen, T } from '../components/ui';
import { COLORS } from '../constants/theme';
import { useApp } from '../state/store';
import { chooseCard } from '../engine/ai';
import { rankLabel, roundWinner, sortHand, type Card, type Play } from '../engine/cards';
import { TUTORIAL_HANDS, LEFT, PARTNER, RIGHT, YOU } from '../engine/game';
import { scoreDeal } from '../engine/scoring';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Short code for a card, e.g. 'QH', 'AS', '10D'. */
const shortId = (c: Card): string => `${rankLabel(c.rank)}${c.suit}`;

export default function Tutorial() {
  const { markTutorialDone, settings } = useApp();
  // Short screens (phone browsers with their toolbars) get a tighter table.
  const short = useWindowDimensions().height < 760;
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

  const seatWonRef = useRef([0, 0, 0, 0]);
  const [seatWon, setSeatWon] = useState([0, 0, 0, 0]);
  const [lastWinner, setLastWinner] = useState<number | null>(null);
  const credit = (winner: number) => {
    if (winner === YOU || winner === PARTNER) {
      wonRef.current = { ...wonRef.current, us: wonRef.current.us + 1 };
    } else {
      wonRef.current = { ...wonRef.current, them: wonRef.current.them + 1 };
    }
    setWon({ ...wonRef.current });
    seatWonRef.current = seatWonRef.current.map((n, i) => (i === winner ? n + 1 : n));
    setSeatWon([...seatWonRef.current]);
    setLastWinner(winner);
  };

  const setPlaysBoth = (p: Play[]) => {
    if (p.length === 0) setLastWinner(null);
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
    credit(winner);
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
      credit(winner);
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
  const highlight = (c: Card): boolean => {
    const id = shortId(c);
    if (step === 2) return id === 'AS' || id === 'KS';
    if (awaitCard) return id === awaitCard;
    if (tryCard) return id === tryCard;
    return false;
  };
  const roundDone = !busy && plays.length > 0;
  const canGotIt =
    step === 1 ||
    step === 2 ||
    ((step === 4 || step === 5 || step === 6 || step === 7) && roundDone) ||
    (step === 8 && !!dealResult) ||
    step === 9;
  const onGotIt = () => {
    if (step === 1) {
      setStep(2);
      setCoach('These are your cards. The big ones usually win a round. Your Ace and King of spades are strong — spades beat everything.');
    } else if (step === 2) {
      setStep(3);
      setCoach('How many rounds do you think you’ll win? Tap a number. With this hand, 3 is a good promise.');
      setShowPromise(true);
    } else if (step === 4) {
      void beginStep5();
    } else if (step === 5) {
      setStep(6);
      setCoach('Your turn to start a round. Try to play a spade.');
      setTryCard('AS');
      clearPlays();
    } else if (step === 6) {
      void beginStep7();
    } else if (step === 7) {
      void fastForward();
    } else if (step === 8) {
      setStep(9);
      setCoach('One more idea: promise 0 and it’s called going zero. Win zero rounds and it’s +100. Win even one and it’s -100. Only try it when your hand is weak.');
    } else if (step === 9) {
      setStep(10);
      setCoach('That’s the whole game. Keep playing deals until one side reaches 500. Win the game and you earn Coins and climb in rank — and unlock the rest of the family.');
    }
  };

  const promised = teamPromise > 0;
  const promising = step === 3 && showPromise;
  const spadesOpen = handsState.flat().filter((c) => c.suit === 'S').length < 13;
  const scoreUs = step === 10 && dealResult ? dealResult.usPoints : 0;
  const scoreThem = step === 10 && dealResult ? dealResult.themPoints : 0;
  const roundsPlayed = won.us + won.them;
  const PILL_POS = [
    { label: 'Grandma Rose — your partner', left: 96, top: 4, open: false },
    { label: 'First to 500 wins', left: 130, top: 100, open: true },
    { label: 'Left — other side', left: 10, top: 150, open: false },
    { label: 'Right — other side', left: 236, top: 150, open: false },
    { label: 'You', left: 168, top: 206, open: true },
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 0, paddingBottom: 0, flexGrow: 1 }}>
      <TopBar us={scoreUs} them={scoreThem} deal={1} onClose={() => router.replace('/')} />
      <PartnerRow
        name="Grandma Rose"
        stem="grandma"
        mood={lastWinner === PARTNER || lastWinner === YOU ? 'happy' : 'neutral'}
        compact={short}
        info={seatInfo(promised ? 4 : null, seatWon[PARTNER], handsState[PARTNER].length, false)}
      />
      {promising ? null : (
      <View>
        <TableScene
          left={seatInfo(promised ? 2 : null, seatWon[LEFT], handsState[LEFT].length, false)}
          right={seatInfo(promised ? 2 : null, seatWon[RIGHT], handsState[RIGHT].length, false)}
          plays={plays}
          winnerSeat={roundDone ? lastWinner : null}
          maxH={short ? 190 : undefined}
        >
          {step === 1 ? (
            <>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 252, backgroundColor: 'rgba(29,42,68,0.35)' }} />
              {PILL_POS.map((p) => (
                <Pill key={p.label} label={p.label} open={p.open} style={{ position: 'absolute', left: p.left, top: p.top }} />
              ))}
            </>
          ) : null}
          {step === 9 ? (
            <>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 252, backgroundColor: 'rgba(29,42,68,0.55)' }} />
              <View style={{ position: 'absolute', left: 150, top: 58, width: 90, height: 132, backgroundColor: COLORS.paper, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 5, boxShadow: `0 3px 0 ${COLORS.ink}`, alignItems: 'center', paddingTop: 14 }}>
                <T px size={11} center>
                  {'GO\nZERO'}
                </T>
                <T px size={34} style={{ marginTop: 10 }}>
                  0
                </T>
                <T size={11}>0 rounds</T>
              </View>
            </>
          ) : null}
          {step === 10 ? (
            <>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 252, backgroundColor: 'rgba(29,42,68,0.55)' }} />
              <View style={{ position: 'absolute', left: 60, top: 70, width: 270, padding: 12, backgroundColor: COLORS.paper, borderWidth: 4, borderColor: COLORS.ink, borderRadius: 6, alignItems: 'center' }}>
                <T px size={14} center>
                  YOU {scoreUs} • THEM {scoreThem}
                </T>
                <T size={13} style={{ marginTop: 6 }}>
                  First to 500 wins
                </T>
              </View>
            </>
          ) : null}
        </TableScene>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 4, flexWrap: 'wrap' }}>
          <Pill label="Spades beat everything" />
          <Pill label={spadesOpen ? 'Spades are open now' : 'No spade has been played yet'} open={spadesOpen} />
        </View>
        <Coach
          text={coach}
          tut
          action={canGotIt ? <BtnS label="Got it" size={14} onPress={onGotIt} style={{ width: 86, minHeight: 44, paddingHorizontal: 6, marginBottom: 0 }} /> : null}
        />
      </View>
      )}
      {promising ? (
          <View style={{ marginHorizontal: 12, marginBottom: 8 }}>
            <PromisePicker
              hand={myHand}
              partnerPromise={4}
              partnerName="Grandma"
              seePartnerPromise
              opponentPromises={[
                { name: 'Left', promise: 2 },
                { name: 'Right', promise: 2 },
              ]}
              suggested={3}
              helpOverride={coach}
              onWrongTap={(n) => {
                if (n === 0) setCoach('0 means win zero rounds — not this time.');
                else if (n > 3) setCoach(`${n} is bold — try 3 first.`);
                else setCoach('With this hand, 3 is a good promise.');
              }}
              onConfirm={() => {
                setShowPromise(false);
                setTeamPromise(7);
                setCoach('Grandma promised 4. Together you promised 7. That’s your team promise. You start. Play a card — try your Queen of hearts.');
                setStep(4);
                setAwaitCard('QH');
              }}
            />
          </View>
        ) : null}

      <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 12, gap: 6 }}>
        {step >= 2 ? (
          <Hand
            cards={myHand}
            large={settings.cardSize === 'large'}
            isLegal={(c) => (awaitCard || tryCard ? highlight(c) || null : null)}
            pulse={highlight}
            onTap={onTapCard}
            disabled={busy || (!awaitCard && !tryCard)}
          />
        ) : null}
        {step === 10 ? (
          <View style={{ marginHorizontal: 16, gap: 6 }}>
            <BtnP
              label="PLAY A REAL GAME"
              size={12}
              onPress={() => {
                markTutorialDone();
                router.push('/pick');
              }}
            />
            <BtnS
              label="Back to Home"
              onPress={() => {
                markTutorialDone();
                router.replace('/');
              }}
            />
            <T size={12} center>
              Practice only — no Coins for this one.
            </T>
          </View>
        ) : promising ? null : (
          <YouPanel
            compact={short}
            info={seatInfo(promised ? 3 : null, seatWon[YOU], myHand.length, false)}
            roundsLeft={Math.max(0, 13 - roundsPlayed)}
          />
        )}
      </View>
    </Screen>
  );
}
