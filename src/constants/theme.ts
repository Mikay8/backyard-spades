// Visual direction — brief §15 (proposal palette: backyard at golden hour).
// Warm grass green table, wood brown, red-white check, cream/paper cards,
// ink-navy text, one hot tomato accent for the primary button. No casino art.
export const COLORS = {
  grass: '#3E7A4E',
  grassDark: '#2F5D3C',
  grassLight: '#5C9468',
  wood: '#8B5E3C',
  woodDark: '#6B4226',
  cream: '#FFF8E7',
  paper: '#FFFDF5',
  ink: '#1F2A44',
  inkSoft: '#4A5568',
  accent: '#E4572E',
  accentDark: '#C7431F',
  gold: '#E9B44C',
  red: '#C0392B',
  cardRed: '#C0392B',
  cardBlack: '#1F2A44',
  line: '#E5DCC3',
  locked: '#9AA0A6',
  win: '#2F7D4F',
  lose: '#8A6D3B',
} as const;

export const FONT = {
  // System stack only — no custom font in v1.
  display: 'System' as const,
};
