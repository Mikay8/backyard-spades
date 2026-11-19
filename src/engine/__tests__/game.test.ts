// Full game engine — deals, legal play, spades rule, deal scoring.
import { chooseCard } from '../ai';
import { parseCard, roundWinner } from '../cards';
import {
  LEFT,
  PARTNER,
  RIGHT,
  TUTORIAL_HANDS,
  YOU,
  createGame,
  legalForTurn,
  nextDeal,
  playAiTurn,
  playCard,
  setPlayerPromise,
  teamPromise,
  teamWon,
} from '../game';
import { scoreDeal } from '../scoring';

describe('createGame', () => {
  it('deals 13 cards to each of 4 players, 52 unique cards', () => {
    const g = createGame({ partnerId: 'grandma' });
    expect(g.hands).toHaveLength(4);
    for (const h of g.hands) expect(h).toHaveLength(13);
    const all = g.hands.flat().map((c) => `${c.suit}${c.rank}`);
    expect(new Set(all).size).toBe(52);
  });
  it('AI promises are made at deal start; the player has not promised yet', () => {
    const g = createGame({ partnerId: 'grandma' });
    expect(g.promises[YOU]).toBeNull();
    expect(g.promises[PARTNER]).not.toBeNull();
    expect(g.promises[LEFT]).not.toBeNull();
    expect(g.promises[RIGHT]).not.toBeNull();
  });
});

describe('legal play', () => {
  it('cannot lead a spade before spades are open when holding other suits', () => {
    const g = createGame({ partnerId: 'grandma', fixedHands: TUTORIAL_HANDS });
    let state = setPlayerPromise(g, 3);
    // Force the lead to the player: leader is seat 1 (dealer 0 + 1). Play the
    // AI lead first via playAiTurn, then check the player's legal cards.
    state = playAiTurn(state);
    // The player's hand still holds spades + other suits; spades are not open.
    const legal = legalForTurn(state);
    expect(legal.every((c) => c.suit !== 'S')).toBe(true);
  });

  it('must follow suit when you have it', () => {
    const g = createGame({ partnerId: 'grandma', fixedHands: TUTORIAL_HANDS });
    let state = setPlayerPromise(g, 3);
    state = playAiTurn(state); // Left leads
    const ledSuit = state.currentPlays[0].card.suit;
    const hasLed = state.hands[YOU].some((c) => c.suit === ledSuit);
    if (hasLed) {
      expect(legalForTurn(state).every((c) => c.suit === ledSuit)).toBe(true);
    }
  });

  it('an illegal card is rejected (state unchanged)', () => {
    const g = createGame({ partnerId: 'grandma', fixedHands: TUTORIAL_HANDS });
    const state = setPlayerPromise(g, 3);
    const afterLead = playAiTurn(state);
    const ledSuit = afterLead.currentPlays[0].card.suit;
    const wrong = afterLead.hands[YOU].find((c) => c.suit !== ledSuit);
    if (wrong && afterLead.hands[YOU].some((c) => c.suit === ledSuit)) {
      expect(playCard(afterLead, YOU, wrong)).toBe(afterLead);
    }
  });
});

describe('full simulated game', () => {
  it('plays to completion: deals score, game ends at 500 or -200', () => {
    let g = createGame({ partnerId: 'grandma' });
    let guard = 0;
    // One loop iteration is one action (one card or one promise); a full game
    // needs ~13 plays × 4 seats × several deals, so the guard is generous.
    while (g.phase !== 'gameOver' && guard < 2000) {
      guard += 1;
      if (g.phase === 'promise') {
        // Player promises its estimate.
        const est = g.hands[YOU].filter((c) => c.rank === 14).length;
        g = setPlayerPromise(g, Math.min(13, est));
      } else if (g.phase === 'dealScore') {
        g = nextDeal(g);
      } else {
        if (g.turnSeat === YOU) {
          const legal = legalForTurn(g);
          g = playCard(g, YOU, legal[0]);
        } else {
          g = playAiTurn(g);
        }
      }
    }
    expect(g.phase).toBe('gameOver');
    expect(['us', 'them']).toContain(g.winner);
    expect(g.dealHistory.length).toBeGreaterThan(0);
    // Scores are exactly the sum of the deal points.
    const usSum = g.dealHistory.reduce((s, d) => s + d.usPoints, 0);
    const themSum = g.dealHistory.reduce((s, d) => s + d.themPoints, 0);
    expect(g.scores.us).toBe(usSum);
    expect(g.scores.them).toBe(themSum);
    // Every deal had 13 rounds split between the teams (counted rounds).
    for (const d of g.dealHistory) {
      expect(d.usWon + d.themWon).toBeLessThanOrEqual(13);
    }
  });

  it('a go-zero partner win does not count toward the team promise', () => {
    // June goes zero with a weak hand; verify teamWon excludes her rounds.
    const g = createGame({ partnerId: 'june' });
    // Force June to go zero and win a round: craft state directly.
    const state = { ...g, promises: [3, 2, 0, 2], wonRounds: [2, 1, 1, 1] };
    expect(teamWon(state, 'us')).toBe(2); // only the player's 2 count
    expect(teamPromise(state, 'us')).toBe(3);
  });
});

describe('tutorial fixed deal', () => {
  it('is a legal 52-card deal: 13 each, all unique', () => {
    const all = TUTORIAL_HANDS.flat().map((c) => `${c.suit}${c.rank}`);
    expect(all).toHaveLength(52);
    expect(new Set(all).size).toBe(52);
    for (const h of TUTORIAL_HANDS) expect(h).toHaveLength(13);
  });

  it('scripted rounds 4–7 resolve as the tutorial says', () => {
    // Round 4: You QH, Grandma AH, Left 9H, Right 7H → Grandma wins.
    expect(
      roundWinner([
        { seat: YOU, card: parseCard('QH') },
        { seat: PARTNER, card: parseCard('AH') },
        { seat: LEFT, card: parseCard('9H') },
        { seat: RIGHT, card: parseCard('7H') },
      ]),
    ).toBe(PARTNER);
    // Round 5: Grandma KD, Left 3D, You QD, Right 3S → Right wins (spade).
    expect(
      roundWinner([
        { seat: PARTNER, card: parseCard('KD') },
        { seat: LEFT, card: parseCard('3D') },
        { seat: YOU, card: parseCard('QD') },
        { seat: RIGHT, card: parseCard('3S') },
      ]),
    ).toBe(RIGHT);
    // Round 6: You 9C, Grandma QC, Left KC, Right 6C → Left wins.
    expect(
      roundWinner([
        { seat: YOU, card: parseCard('9C') },
        { seat: PARTNER, card: parseCard('QC') },
        { seat: LEFT, card: parseCard('KC') },
        { seat: RIGHT, card: parseCard('6C') },
      ]),
    ).toBe(LEFT);
    // Round 7: Left 7S, You AS, Grandma 5S, Right 8S → You win.
    expect(
      roundWinner([
        { seat: LEFT, card: parseCard('7S') },
        { seat: YOU, card: parseCard('AS') },
        { seat: PARTNER, card: parseCard('5S') },
        { seat: RIGHT, card: parseCard('8S') },
      ]),
    ).toBe(YOU);
  });

  it('fast-forward of the remaining 9 rounds finishes the deal with real AI', () => {
    // Reproduce the tutorial's remaining hands after round 7 and play them
    // out with balanced AI, exactly as the tutorial screen does.
    const hands = TUTORIAL_HANDS.map((h) => [...h]);
    // NOTE: Left never played KD — Grandma led it in round 5 (see the
    // tutorial header comment); Left followed with the 3 of diamonds.
    const played: Record<number, string[]> = {
      [YOU]: ['QH', 'QD', '9C', 'AS'],
      [LEFT]: ['9H', '3D', 'KC', '7S'],
      [PARTNER]: ['AH', 'KD', 'QC', '5S'],
      [RIGHT]: ['7H', '3S', '6C', '8S'],
    };
    for (const [seat, codes] of Object.entries(played)) {
      for (const code of codes) {
        const c = parseCard(code);
        hands[Number(seat)] = hands[Number(seat)].filter(
          (x) => !(x.suit === c.suit && x.rank === c.rank),
        );
      }
    }
    for (const h of hands) expect(h).toHaveLength(9);
    let usWon = 2; // rounds 4 and 7
    let themWon = 2; // rounds 5 and 6
    let leader = YOU;
    let spadesBroken = true;
    for (let round = 0; round < 9; round++) {
      const plays: { seat: number; card: ReturnType<typeof parseCard> }[] = [];
      for (let i = 0; i < 4; i++) {
        const seat = (leader + i) % 4;
        const hand = hands[seat];
        const choice = chooseCard('balanced', {
          hand,
          ledSuit: plays.length > 0 ? plays[0].card.suit : null,
          plays,
          spadesBroken,
          mySeat: seat,
          partnerSeat: seat === YOU ? PARTNER : seat === PARTNER ? YOU : seat === LEFT ? RIGHT : LEFT,
          currentWinnerSeat: plays.length > 0 ? roundWinner(plays) : null,
          goingZero: false,
          teamMadePromise: false,
          roundsLeft: hand.length,
        });
        if (choice.card.suit === 'S') spadesBroken = true;
        hands[seat] = hand.filter((x) => !(x.suit === choice.card.suit && x.rank === choice.card.rank));
        plays.push({ seat, card: choice.card });
      }
      const winner = roundWinner(plays);
      if (winner === YOU || winner === PARTNER) usWon += 1;
      else themWon += 1;
      leader = winner;
    }
    expect(usWon + themWon).toBe(13);
    const s = scoreDeal({ teamPromise: 7, teamWon: usWon, goZero: [], extrasBankBefore: 0 });
    // The tutorial's coach line uses these real numbers; log them for the report.
    console.log(`tutorial fast-forward: promised 7, won ${usWon} → +${s.points} points`);
    expect(s.points).toBe(usWon >= 7 ? 70 + (usWon - 7) : -70);
  });
});
