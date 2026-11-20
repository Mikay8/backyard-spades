// Dev-only unlock flag — off in production (see src/constants/devmode.ts).

describe('DEV_UNLOCK_ALL flag', () => {
  const loadFlag = (): boolean => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../constants/devmode').DEV_UNLOCK_ALL as boolean;
  };

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL;
    jest.resetModules();
  });

  it('is off by default (production: the variable is never set)', () => {
    delete process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL;
    expect(loadFlag()).toBe(false);
  });

  it('is on only when the variable is exactly "1"', () => {
    process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL = '1';
    expect(loadFlag()).toBe(true);
  });

  it('is off for any other value, including "true"', () => {
    process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL = 'true';
    expect(loadFlag()).toBe(false);
    process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL = '0';
    expect(loadFlag()).toBe(false);
    process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL = '';
    expect(loadFlag()).toBe(false);
  });

  it('the dev balance covers every purchase many times over', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DEV_COINS } = require('../../constants/devmode') as { DEV_COINS: number };
    // All partners (505) + all Shed items (~355) + Cheater's Mirror (1000).
    expect(DEV_COINS).toBeGreaterThan(505 + 355 + 1000);
  });
});
