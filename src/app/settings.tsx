// Settings — design canvas. Pixel section heads, toggle rows, locked rows,
// links, data + reset, about.
import { router } from 'expo-router';
import { goBack } from '../navigation';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Lock } from '../components/PartnerCard';
import { BtnS, Coin, DevBadge, Header, Screen, Sheet, T, Toggle, usePalette } from '../components/ui';
import { COLORS } from '../constants/theme';
import { DIFFICULTIES, effectiveDifficulty, isBelow, minDifficultyForRank, difficultyDef } from '../constants/difficulty';
import { useApp } from '../state/store';

const GAME_LENGTHS = [
  { id: 'quick', label: 'Quick — 250' },
  { id: 'classic', label: 'Classic — 500' },
] as const;
const TABLE_THEMES = [
  { id: 'check', label: 'Picnic Check' },
  { id: 'grass', label: 'Grass' },
  { id: 'wood', label: 'Wood' },
] as const;
const CARD_BACKS = [
  { id: 'check', label: 'Picnic Check' },
  { id: 'green', label: 'Green' },
  { id: 'navy', label: 'Navy' },
] as const;

const H: React.FC<{ t: string }> = ({ t }) => (
  <T px size={10} style={{ marginTop: 18, marginBottom: 6 }} accessibilityRole="header">
    {t}
  </T>
);

const LinkRow: React.FC<{ t: string; onPress: () => void }> = ({ t, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="link"
    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderColor: COLORS.line, minHeight: 48 }}
  >
    <T x size={15}>
      {t}
    </T>
    <T x size={15} aria-hidden>
      ›
    </T>
  </Pressable>
);

const LockedRow: React.FC<{ t: string; sub: string }> = ({ t, sub }) => (
  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: 2, borderColor: COLORS.line, minHeight: 52, opacity: 0.75 }}>
    <Lock size={18} />
    <View>
      <T x size={15}>
        {t}
      </T>
      <T size={12}>{sub}</T>
    </View>
  </View>
);

const Choice: React.FC<{ t: string; options: readonly { id: string; label: string }[]; value: string; onPick: (id: string) => void }> = ({
  t,
  options,
  value,
  onPick,
}) => (
  <View style={{ paddingVertical: 8, borderTopWidth: 2, borderColor: COLORS.line }}>
    <T x size={15}>
      {t}
    </T>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onPick(o.id)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.id }}
          style={{ flex: 1, minHeight: 44, borderWidth: 3, borderColor: COLORS.ink, borderRadius: 6, backgroundColor: value === o.id ? COLORS.sun : COLORS.paper, alignItems: 'center', justifyContent: 'center' }}
        >
          <T x size={12}>
            {o.label}
          </T>
        </Pressable>
      ))}
    </View>
  </View>
);

/** Difficulty: your rank sets the minimum; pick harder for bigger win Coins. */
const DifficultyPicker: React.FC = () => {
  const { settings, updateSettings, rank } = useApp();
  const pal = usePalette();
  const floor = minDifficultyForRank(rank);
  const current = effectiveDifficulty(settings.difficulty, rank);
  return (
    <View style={{ paddingVertical: 8, borderTopWidth: 2, borderColor: COLORS.line, gap: 8 }}>
      <T x size={15}>
        Difficulty
      </T>
      <T size={12}>
        How well the other side plays. Harder wins pay more Coins. Your rank sets the minimum — Rank {rank} plays at least{' '}
        <T x size={12}>
          {difficultyDef(floor).name}
        </T>
        , and it goes up as you rank up.
      </T>
      {DIFFICULTIES.map((d) => {
        const locked = isBelow(d.id, floor);
        const on = d.id === current;
        return (
          <Pressable
            key={d.id}
            onPress={() => !locked && updateSettings({ difficulty: d.id })}
            disabled={locked}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled: locked }}
            accessibilityLabel={`${d.name}, win ${d.winCoins} Coins${locked ? ', below your rank' : ''}`}
            style={{
              borderWidth: 3,
              borderColor: COLORS.ink,
              borderRadius: 8,
              backgroundColor: on ? COLORS.sun : COLORS.paper,
              boxShadow: on ? `0 0 0 3px ${pal.tomato}` : `0 3px 0 ${COLORS.ink}`,
              paddingVertical: 8,
              paddingHorizontal: 10,
              opacity: locked ? 0.5 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <T x size={15}>
                {d.name}
                {on ? ' ✓' : ''}
              </T>
              <T size={12}>{locked ? `Below your rank — you're past ${d.name}.` : d.blurb}</T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Coin size={16} />
              <T x size={13}>
                +{d.winCoins}
              </T>
            </View>
          </Pressable>
        );
      })}
      <T size={12}>Coins shown are for a win. A loss pays 5 at any level.</T>
    </View>
  );
};

export default function Settings() {
  const { settings, updateSettings, rank, resetAll, devUnlockAll, setRank } = useApp();
  const pal = usePalette();
  const [confirmReset, setConfirmReset] = useState(false);
  const unlocked = rank >= 15;

  return (
    <Screen
      header={<Header title="SETTINGS" onBack={() => goBack()} />}
      overlay={
        <Sheet visible={confirmReset} onClose={() => setConfirmReset(false)}>
          <T x size={18}>
            Reset everything?
          </T>
          <T size={14}>Your rank, Coins, and partners will be gone. This can’t be undone.</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <BtnS label="Cancel" onPress={() => setConfirmReset(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <BtnS
                label="Reset"
                danger
                onPress={() => {
                  setConfirmReset(false);
                  resetAll();
                  router.replace('/');
                }}
              />
            </View>
          </View>
        </Sheet>
      }
    >
      {devUnlockAll ? (
        <>
          <DevBadge />
          <H t="Development" />
          <T size={13} style={{ paddingBottom: 6 }}>
            Choose your rank to test what each rank unlocks. Only in the dev build.
          </T>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <BtnS label="−" size={18} disabled={rank <= 1} onPress={() => setRank(rank - 1)} />
            </View>
            <T x size={16} center style={{ minWidth: 72 }}>
              Rank {rank}
            </T>
            <View style={{ flex: 1 }}>
              <BtnS label="+" size={18} disabled={rank >= 15} onPress={() => setRank(rank + 1)} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[1, 5, 10, 15].map((r) => (
              <View key={r} style={{ flex: 1 }}>
                <BtnS label={`Rank ${r}`} size={12} disabled={rank === r} onPress={() => setRank(r)} />
              </View>
            ))}
          </View>
          <T size={12} style={{ paddingTop: 6 }}>
            Rank 5: see your partner&apos;s promise. Rank 10: favourite partner + partner review. Rank 15:
            table themes + card backs.
          </T>
        </>
      ) : null}
      <H t="Game" />
      <Choice
        t="Game length"
        options={GAME_LENGTHS}
        value={settings.gameLength}
        onPick={(id) => updateSettings({ gameLength: id as typeof settings.gameLength })}
      />
      <T size={12} style={{ paddingBottom: 6 }}>
        {settings.gameLength === 'quick' ? 'Quick: first to 250 wins — about half as many deals.' : 'Classic: first to 500 wins.'} Applies to your next game.
      </T>
      <DifficultyPicker />

      <H t="Sound" />
      <Toggle label="Sound" sub="Mutes all game sounds" value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
      {settings.sound ? <Toggle label="Card sounds" sub="Slide and table tap" value={settings.cardSounds} onChange={(v) => updateSettings({ cardSounds: v })} /> : null}

      <H t="Feel" />
      <Toggle label="Haptics" sub="Light tap on card land" value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
      <Toggle
        label="Reduced motion"
        sub="Fades and instant counts instead of slides and shakes"
        value={settings.reducedMotion}
        onChange={(v) => updateSettings({ reducedMotion: v })}
      />

      <H t="Reading the cards" />
      <Toggle
        label="Colour-vision mode"
        sub="Shapes and patterns first, never colour alone"
        value={settings.colourVision}
        onChange={(v) => updateSettings({ colourVision: v })}
      />
      <Toggle
        label="Large cards"
        sub="Fewer cards visible — bigger to read"
        value={settings.cardSize === 'large'}
        onChange={(v) => updateSettings({ cardSize: v ? 'large' : 'normal' })}
      />

      <H t="Table" />
      {unlocked ? (
        <>
          <Choice t="Table theme" options={TABLE_THEMES} value={settings.tableTheme} onPick={(id) => updateSettings({ tableTheme: id as typeof settings.tableTheme })} />
          <Choice t="Card back" options={CARD_BACKS} value={settings.cardBack} onPick={(id) => updateSettings({ cardBack: id as typeof settings.cardBack })} />
        </>
      ) : (
        <>
          <LockedRow t="Table theme" sub="Reach Rank 15 — Picnic Check / Grass / Wood" />
          <LockedRow t="Card back" sub="Reach Rank 15 — 3 backs, cosmetic only" />
        </>
      )}

      <H t="Learn the game" />
      <LinkRow t="Interactive Tutorial" onPress={() => router.push('/tutorial')} />
      <LinkRow t="How to Play" onPress={() => router.push('/howto')} />

      <H t="Your data" />
      <T size={13} style={{ paddingVertical: 6 }}>
        Your rank, Coins, and partners live on this device. If the app closes mid-game, that game is forfeited — there is no resume.
      </T>
      <Pressable
        onPress={() => setConfirmReset(true)}
        accessibilityRole="button"
        style={{ marginVertical: 6, borderWidth: 3, borderColor: pal.bad, borderRadius: 8, padding: 12, minHeight: 48, alignItems: 'center' }}
      >
        <T x size={15} color={pal.bad}>
          Reset all data
        </T>
      </Pressable>

      <H t="About" />
      <T size={13} style={{ paddingVertical: 6 }}>
        Backyard Spades is a points-based family card game. No real-money gambling, no prizes, no in-app purchases of currency.
      </T>
      <T size={13} style={{ paddingVertical: 6 }}>
        Version 1.0.0
      </T>
    </Screen>
  );
}
