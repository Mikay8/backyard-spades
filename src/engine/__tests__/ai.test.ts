// Partner AI quirks — brief §9. Deterministic rules, not luck rolls.
import { parseCard, type Card } from '../cards';
import { chooseCard, choosePromise, type AiContext } from '../ai';

const hand = (...codes: string[]): Card[] => codes.map(parseCard);

const baseCtx = (over: Partial<AiContext>): AiContext => ({
  hand: [],
  ledSuit: null,
  plays: [],
  spadesBroken: false,
  mySeat: 2,
  partnerSeat: 0,
  currentWinnerSeat: null,
  goingZero: false,
  teamMadePromise: false,
  roundsLeft: 13,
  ...over,
});

describe('choosePromise', () => {
  // Estimate check: A♠ + A♥ + K♠ = 3 likely winners.
  const three = hand('AS', 'AH', 'KS', '2C', '3D', '4H', '5C', '6D', '7H', '8C', '9D', '10H', 'JC');
  const weak = hand('2C', '3D', '4H', '5C', '6D', '7H', '8C', '9D', '10H', 'JC', 'QD', '2H', '3C');

  it('Dre promises estimate + 1, always', () => {
    expect(choosePromise(three, 'dre')).toBe(4);
  });
  it('Grandma promises low (estimate - 1)', () => {
    expect(choosePromise(three, 'grandma')).toBe(2);
  });
  it('Marcus promises accurately', () => {
    expect(choosePromise(three, 'marcus')).toBe(3);
  });
  it('Theo promises high (estimate + 1)', () => {
    expect(choosePromise(three, 'theo')).toBe(4);
  });
  it('Dad promises low (estimate - 1)', () => {
    expect(choosePromise(three, 'dad')).toBe(2);
  });
  it('Mae promises high (estimate + 1)', () => {
    expect(choosePromise(three, 'mae')).toBe(4);
  });
  it('June goes zero when she can (weak hand)', () => {
    expect(choosePromise(weak, 'june')).toBe(0);
  });
  it('Mae goes zero on a weak hand', () => {
    expect(choosePromise(weak, 'mae')).toBe(0);
  });
  it('balanced opponents promise the estimate', () => {
    expect(choosePromise(three, 'balanced')).toBe(3);
  });
});

describe('chooseCard — quirk rules', () => {
  it('Grandma always leads her lowest card', () => {
    const ctx = baseCtx({ hand: hand('AS', '5H', '2C'), spadesBroken: false });
    expect(chooseCard('grandma', ctx).card).toEqual(parseCard('2C'));
  });

  it('Theo leads spades at the first legal chance', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: true });
    expect(chooseCard('theo', ctx).card).toEqual(parseCard('AS'));
  });

  it('Theo does not lead a spade before spades are open', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: false });
    expect(chooseCard('theo', ctx).card).toEqual(parseCard('KH'));
  });

  it('Marcus never plays a spade until he has to (void in led suit)', () => {
    const ctx = baseCtx({
      hand: hand('2S', '5C', '9D'),
      ledSuit: 'H',
      plays: [{ seat: 1, card: parseCard('KH') }],
      currentWinnerSeat: 1,
    });
    // He could win with the 2 of spades; he discards his lowest non-spade instead.
    expect(chooseCard('marcus', ctx).card).toEqual(parseCard('5C'));
  });

  it('Mom never steals your win: partner has the round, she plays low', () => {
    const ctx = baseCtx({
      hand: hand('AH', '2H'),
      ledSuit: 'H',
      plays: [{ seat: 0, card: parseCard('QH') }],
      currentWinnerSeat: 0, // partner (seat 0) is winning with the Queen
    });
    expect(chooseCard('mom', ctx).card).toEqual(parseCard('2H'));
  });

  it('Dre steals your win: partner has the round, he plays the lowest winner', () => {
    const ctx = baseCtx({
      hand: hand('AH', '2H'),
      ledSuit: 'H',
      plays: [{ seat: 0, card: parseCard('QH') }],
      currentWinnerSeat: 0,
    });
    expect(chooseCard('dre', ctx).card).toEqual(parseCard('AH'));
  });

  it('going zero always tries to lose', () => {
    const ctx = baseCtx({
      hand: hand('AH', '2H'),
      ledSuit: 'H',
      plays: [{ seat: 1, card: parseCard('KH') }],
      currentWinnerSeat: 1,
      goingZero: true,
    });
    // Highest card that still loses is the 2; the Ace would win.
    expect(chooseCard('june', ctx).card).toEqual(parseCard('2H'));
  });

  it('Dad ducks once the team promise is already made', () => {
    const ctx = baseCtx({
      hand: hand('AH', '2H'),
      ledSuit: 'H',
      plays: [{ seat: 1, card: parseCard('KH') }],
      currentWinnerSeat: 1,
      teamMadePromise: true,
    });
    expect(chooseCard('dad', ctx).card).toEqual(parseCard('2H'));
  });

  it('choice is deterministic: same input, same card', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: true });
    expect(chooseCard('theo', ctx).card).toEqual(chooseCard('theo', ctx).card);
  });
});
