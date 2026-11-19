// Visual direction — "Family Card Night — 16-bit Pixel Art" design canvas.
// Cream ground, ink-navy outlines with hard drop shadows, one tomato accent,
// wood-framed pixel portraits, Press Start 2P for display + Nunito for body.
export const COLORS = {
  ink: '#1d2a44',
  paper: '#fffaf0',
  cream: '#fbf1dc',
  tomato: '#c9432a',
  wood: '#8a5a34',
  woodDark: '#5a381d',
  sun: '#f6d55c',
  ok: '#2f7d4a',
  bad: '#b93a22',
  cardRed: '#c2301f',
  line: '#e3d8bb',
  note: '#fff1b8',
  noteSoft: '#f3e9cd',
  disabled: '#d5ceba',
  disabledInk: '#5e5a50',
  disabledLine: '#8a8472',
  toggleOff: '#cfc7b2',
  scrim: 'rgba(29,42,68,0.6)',
  frameOuter: '#140c1c',

  // Legacy names kept so older call sites keep compiling.
  accent: '#c9432a',
  accentDark: '#a8361f',
  grass: '#2f7d4a',
  grassDark: '#245f39',
  grassLight: '#5c9468',
  inkSoft: '#3d4a66',
  gold: '#f6d55c',
  red: '#b93a22',
  cardBlack: '#1d2a44',
  locked: '#9aa0a6',
  win: '#2f7d4a',
  lose: '#b93a22',
} as const;

/** Colour-vision mode swaps red/green for orange/blue (shape + words carry meaning too). */
export const CVM = {
  tomato: '#b04a08',
  ok: '#1b5fa8',
  bad: '#b04a08',
} as const;

export const FONT = {
  /** Pixel display face — headings, buttons, scores. */
  px: 'PressStart2P_400Regular',
  /** Body copy. */
  body: 'Nunito_700Bold',
  bodyX: 'Nunito_800ExtraBold',
  display: 'PressStart2P_400Regular',
} as const;

/** Phone column width from the design; wider screens centre it. */
export const PHONE_W = 430;
