// On-device state only — brief §17. No accounts, no server. Mirrors the
// Flapjack21 AsyncStorage pattern (JSON under a namespaced key, silent
// failure leaves the game playable).
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GO_ZERO_WIN_COINS_BONUS,
  GO_ZERO_WIN_XP_BONUS,
  LOSS_COINS,
  LOSS_XP,
  PARTNERS,
  STARTER_COINS,
  WIN_XP,
  partnerById,
  rankForXp,
  type PartnerDef,
} from '../constants/partners';
import { effectiveStats, itemById } from '../constants/items';
import { difficultyDef, effectiveDifficulty, type Difficulty } from '../constants/difficulty';
import { createGame, type DealResult, type GameState } from '../engine/game';

const PROFILE_KEY = 'backyard:profile-v1';
const SETTINGS_KEY = 'backyard:settings-v1';

export interface LastGame {
  partnerId: string;
  won: boolean;
  finalUs: number;
  finalThem: number;
  coinsEarned: number;
  dateISO: string;
}

export interface Profile {
  xp: number;
  coins: number;
  owned: string[];
  favourite: string | null;
  gamesPlayed: number;
  wins: number;
  gamesWithPartner: Record<string, { played: number; won: number }>;
  lastGame: LastGame | null;
  tutorialDone: boolean;
  /** Shed items owned (id → true). */
  items: Record<string, boolean>;
  /** Equipped item per partner (partnerId → itemId). One item per partner. */
  equip: Record<string, string>;
  /** Cheater's Mirror peeks left. */
  mirror: number;
  /** Partner currently picked (Home, Pick, Shed equip target). */
  picked: string;
}

export const EMPTY_PROFILE: Profile = {
  xp: 0,
  coins: STARTER_COINS,
  owned: ['grandma', 'dre'],
  favourite: null,
  gamesPlayed: 0,
  wins: 0,
  gamesWithPartner: {},
  lastGame: null,
  tutorialDone: false,
  items: {},
  equip: {},
  mirror: 0,
  picked: 'grandma',
};

export interface Settings {
  sound: boolean;
  cardSounds: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  colourVision: boolean;
  cardSize: 'normal' | 'large';
  tableTheme: 'check' | 'grass' | 'wood';
  cardBack: 'check' | 'green' | 'navy';
  /** Quick = first to 250, Classic = first to 500. */
  gameLength: 'quick' | 'classic';
  /** Difficulty you chose. You never play below your rank's minimum (effectiveDifficulty). */
  difficulty: Difficulty;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  cardSounds: true,
  haptics: true,
  reducedMotion: false,
  colourVision: false,
  cardSize: 'normal',
  tableTheme: 'check',
  cardBack: 'check',
  gameLength: 'quick',
  difficulty: 'easy',
};

export interface GameResult {
  partnerId: string;
  won: boolean;
  finalUs: number;
  finalThem: number;
  deals: DealResult[];
  coinsEarned: number;
  xpEarned: number;
  rankBefore: number;
  rankAfter: number;
  partnerReview: string;
  partnerReview2: string | null;
  playerWentZeroClean: boolean;
  newlyBuyable: PartnerDef[];
  /** Difficulty the game was played at (sets the win Coins). */
  difficulty: Difficulty;
}

/** Points needed to win a game with these settings. */
export const targetFor = (s: Settings): number => (s.gameLength === 'classic' ? 500 : 250);

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — the game still plays.
  }
}

interface AppContextValue {
  profile: Profile;
  settings: Settings;
  loaded: boolean;
  rank: number;
  game: GameState | null;
  result: GameResult | null;
  /** Last finished game, kept after a new game starts so Home's last-game
   *  card can open the result screen read-only (brief §12.1). */
  lastResult: GameResult | null;
  startGame: (partnerId: string) => void;
  setGame: (g: GameState | null) => void;
  finishGame: (g: GameState) => GameResult;
  buyPartner: (partnerId: string) => boolean;
  setFavourite: (partnerId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  markTutorialDone: () => void;
  resetAll: () => void;
  /** Buy a Shed item. Returns false when short of Coins. */
  buyItem: (itemId: string) => boolean;
  /** Equip (or take off, if already on) an item on a partner. */
  equipItem: (itemId: string, partnerId: string) => void;
  /** Spend one Cheater's Mirror peek. */
  spendMirror: () => void;
  setPicked: (partnerId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export const partnerReviewLines = (g: GameState): { line1: string; line2: string | null } => {
  const partner = partnerById(g.partnerId);
  const promised = g.dealHistory.reduce((s, d) => s + d.partnerPromise, 0);
  const won = g.dealHistory.reduce((s, d) => s + d.partnerWon, 0);
  const line1 = `${partner.name.split(' ')[0]} promised ${promised}, won ${won}.`;
  let line2: string | null = null;
  if (g.partnerId === 'grandma' && g.partnerStats.ledLow > 0) {
    line2 = `Grandma led low ${g.partnerStats.ledLow} time${g.partnerStats.ledLow === 1 ? '' : 's'}.`;
  } else if (g.partnerStats.stole > 0) {
    line2 = `${partner.name.split(' ')[0]} took ${g.partnerStats.stole} round${g.partnerStats.stole === 1 ? '' : 's'} you had covered.`;
  } else if (g.partnerId === 'theo') {
    line2 = 'Theo got the spades out early.';
  } else if (g.partnerId === 'marcus') {
    line2 = 'Marcus never wasted a spade.';
  }
  return { line1, line2 };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [game, setGameState] = useState<GameState | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const profileRef = useRef(profile);
  const settingsRef = useRef(settings);
  useEffect(() => {
    profileRef.current = profile;
    settingsRef.current = settings;
  });

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([getJSON<Profile>(PROFILE_KEY), getJSON<Settings>(SETTINGS_KEY)]);
      if (p) {
        setProfile({
          ...EMPTY_PROFILE,
          ...p,
          owned: Array.from(new Set(['grandma', 'dre', ...(p.owned ?? [])])),
        });
      }
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoaded(true);
    })();
  }, []);

  const saveProfile = useCallback((p: Profile) => {
    setProfile(p);
    void setJSON(PROFILE_KEY, p);
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        void setJSON(SETTINGS_KEY, next);
        return next;
      });
    },
    [],
  );

  const startGame = useCallback(
    (partnerId: string) => {
      const rank = rankForXp(profileRef.current.xp);
      setResult(null);
      const p = profileRef.current;
      setGameState(
        createGame({
          partnerId,
          seePartnerPromise: rank >= 5,
          target: targetFor(settingsRef.current),
          difficulty: effectiveDifficulty(settingsRef.current.difficulty, rank),
          // The partner plays from their dots, including any equipped item's boost.
          partnerTraits: effectiveStats(partnerById(partnerId), itemById(p.equip[partnerId])),
        }),
      );
    },
    [],
  );

  const setGame = useCallback((g: GameState | null) => setGameState(g), []);

  const finishGame = useCallback(
    (g: GameState): GameResult => {
      const p = profileRef.current;
      const rankBefore = rankForXp(p.xp);
      const won = g.winner === 'us';
      const goZeroBonus = won && g.playerWentZeroClean;
      const xpEarned = (won ? WIN_XP : LOSS_XP) + (goZeroBonus ? GO_ZERO_WIN_XP_BONUS : 0);
      const winCoins = difficultyDef(g.difficulty).winCoins;
      const coinsEarned = (won ? winCoins : LOSS_COINS) + (goZeroBonus ? GO_ZERO_WIN_COINS_BONUS : 0);
      const rankAfter = rankForXp(p.xp + xpEarned);
      const { line1, line2 } = partnerReviewLines(g);
      const unlocked: PartnerDef[] = [];
      // Partners whose rank gate was crossed by this game and are not yet owned.
      for (const def of PARTNERS) {
        if (def.unlockRank > rankBefore && def.unlockRank <= rankAfter && !p.owned.includes(def.id)) {
          unlocked.push(def);
        }
      }
      const withPartner = p.gamesWithPartner[g.partnerId] ?? { played: 0, won: 0 };
      const nextProfile: Profile = {
        ...p,
        xp: p.xp + xpEarned,
        coins: p.coins + coinsEarned,
        gamesPlayed: p.gamesPlayed + 1,
        wins: p.wins + (won ? 1 : 0),
        gamesWithPartner: {
          ...p.gamesWithPartner,
          [g.partnerId]: { played: withPartner.played + 1, won: withPartner.won + (won ? 1 : 0) },
        },
        lastGame: {
          partnerId: g.partnerId,
          won,
          finalUs: g.scores.us,
          finalThem: g.scores.them,
          coinsEarned,
          dateISO: new Date().toISOString(),
        },
      };
      saveProfile(nextProfile);
      const res: GameResult = {
        partnerId: g.partnerId,
        won,
        finalUs: g.scores.us,
        finalThem: g.scores.them,
        deals: g.dealHistory,
        coinsEarned,
        xpEarned,
        rankBefore,
        rankAfter,
        partnerReview: line1,
        partnerReview2: rankAfter >= 10 ? line2 : null,
        playerWentZeroClean: g.playerWentZeroClean,
        newlyBuyable: unlocked,
        difficulty: g.difficulty,
      };
      setResult(res);
      setLastResult(res);
      setGameState(null);
      return res;
    },
    [saveProfile],
  );

  const buyPartner = useCallback(
    (partnerId: string): boolean => {
      const p = profileRef.current;
      const def = partnerById(partnerId);
      const rank = rankForXp(p.xp);
      if (p.owned.includes(partnerId)) return true;
      if (rank < def.unlockRank || p.coins < def.price) return false;
      saveProfile({ ...p, coins: p.coins - def.price, owned: [...p.owned, partnerId] });
      return true;
    },
    [saveProfile],
  );

  const setFavourite = useCallback(
    (partnerId: string) => {
      const p = profileRef.current;
      if (rankForXp(p.xp) < 10) return;
      saveProfile({ ...p, favourite: partnerId });
    },
    [saveProfile],
  );

  const markTutorialDone = useCallback(() => {
    const p = profileRef.current;
    saveProfile({ ...p, tutorialDone: true });
  }, [saveProfile]);

  const buyItem = useCallback(
    (itemId: string): boolean => {
      const p = profileRef.current;
      const item = itemById(itemId);
      if (!item || p.coins < item.price) return false;
      if (item.once) {
        saveProfile({ ...p, coins: p.coins - item.price, mirror: p.mirror + 1 });
        return true;
      }
      if (p.items[itemId]) return true;
      saveProfile({ ...p, coins: p.coins - item.price, items: { ...p.items, [itemId]: true } });
      return true;
    },
    [saveProfile],
  );

  const equipItem = useCallback(
    (itemId: string, partnerId: string) => {
      const p = profileRef.current;
      if (!p.items[itemId]) return;
      const equip = { ...p.equip };
      if (equip[partnerId] === itemId) {
        delete equip[partnerId];
      } else {
        // An item sits on one partner at a time.
        for (const k of Object.keys(equip)) if (equip[k] === itemId) delete equip[k];
        equip[partnerId] = itemId;
      }
      saveProfile({ ...p, equip });
    },
    [saveProfile],
  );

  const spendMirror = useCallback(() => {
    const p = profileRef.current;
    if (p.mirror > 0) saveProfile({ ...p, mirror: p.mirror - 1 });
  }, [saveProfile]);

  const setPicked = useCallback(
    (partnerId: string) => {
      const p = profileRef.current;
      if (p.owned.includes(partnerId) && p.picked !== partnerId) saveProfile({ ...p, picked: partnerId });
    },
    [saveProfile],
  );

  const resetAll = useCallback(() => {
    saveProfile(EMPTY_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    void setJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
    setGameState(null);
    setResult(null);
    setLastResult(null);
  }, [saveProfile]);

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      settings,
      loaded,
      rank: rankForXp(profile.xp),
      game,
      result,
      lastResult,
      startGame,
      setGame,
      finishGame,
      buyPartner,
      setFavourite,
      updateSettings,
      markTutorialDone,
      resetAll,
      buyItem,
      equipItem,
      spendMirror,
      setPicked,
    }),
    [profile, settings, loaded, game, result, lastResult, startGame, setGame, finishGame, buyPartner, setFavourite, updateSettings, markTutorialDone, resetAll, buyItem, equipItem, spendMirror, setPicked],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
