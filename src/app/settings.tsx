// Settings — brief §12.8 in full.
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Btn, ToggleRow, Wordmark, styles } from '../components/ui';
import { COLORS } from '../constants/theme';
import { useApp } from '../state/store';

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

export default function Settings() {
  const { settings, updateSettings, rank, resetAll } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const themesUnlocked = rank >= 15;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: COLORS.grass, fontWeight: '700' }}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>Sound</Text>
        <ToggleRow label="Sound" hint="On by default — mutes all game sounds." value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        {settings.sound ? (
          <ToggleRow label="Card sounds" value={settings.cardSounds} onChange={(v) => updateSettings({ cardSounds: v })} />
        ) : null}

        <Text style={styles.sectionTitle}>Feel</Text>
        <ToggleRow label="Haptics" hint="On by default." value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        <ToggleRow
          label="Reduced motion"
          hint="Replaces slides and shakes with fades. All information stays the same."
          value={settings.reducedMotion}
          onChange={(v) => updateSettings({ reducedMotion: v })}
        />

        <Text style={styles.sectionTitle}>Reading the cards</Text>
        <ToggleRow
          label="Colour-vision mode"
          hint="Win, loss and promise states use shape and words, never colour alone."
          value={settings.colourVision}
          onChange={(v) => updateSettings({ colourVision: v })}
        />
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Card size</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {(['normal', 'large'] as const).map((size) => (
              <Pressable
                key={size}
                onPress={() => updateSettings({ cardSize: size })}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: settings.cardSize === size ? COLORS.grass : '#EDE6D2',
                  marginRight: size === 'normal' ? 6 : 0,
                }}
              >
                <Text style={{ fontWeight: '800', color: settings.cardSize === size ? '#fff' : COLORS.ink }}>
                  {size === 'normal' ? 'Normal' : 'Large'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Table</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Table theme</Text>
          {!themesUnlocked ? (
            <Text style={styles.small}>Reach Rank 15 to choose a table theme.</Text>
          ) : null}
          {TABLE_THEMES.map((t) => (
            <Pressable
              key={t.id}
              disabled={!themesUnlocked}
              onPress={() => updateSettings({ tableTheme: t.id })}
              style={{ paddingVertical: 10, opacity: themesUnlocked ? 1 : 0.5 }}
            >
              <Text style={{ fontWeight: settings.tableTheme === t.id ? '800' : '400', color: COLORS.ink }}>
                {settings.tableTheme === t.id ? '✓ ' : ''}{t.label}
              </Text>
            </Pressable>
          ))}
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink, marginTop: 10 }}>Card back</Text>
          {!themesUnlocked ? (
            <Text style={styles.small}>Reach Rank 15 to choose a card back.</Text>
          ) : null}
          {CARD_BACKS.map((b) => (
            <Pressable
              key={b.id}
              disabled={!themesUnlocked}
              onPress={() => updateSettings({ cardBack: b.id })}
              style={{ paddingVertical: 10, opacity: themesUnlocked ? 1 : 0.5 }}
            >
              <Text style={{ fontWeight: settings.cardBack === b.id ? '800' : '400', color: COLORS.ink }}>
                {settings.cardBack === b.id ? '✓ ' : ''}{b.label}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.small}>Cosmetic only — never changes the cards.</Text>
        </View>

        <Text style={styles.sectionTitle}>Learn the game</Text>
        <Btn label="Interactive Tutorial" onPress={() => router.push('/tutorial')} />
        <Btn label="How to Play" onPress={() => router.push('/howto')} />

        <Text style={styles.sectionTitle}>Your data</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={styles.body}>Your rank, Coins, and partners live on this device.</Text>
          <Text style={styles.small}>Quitting a game mid-way earns no Coins or XP, and the game can’t be resumed.</Text>
          {!confirmReset ? (
            <Btn label="Reset all data" onPress={() => setConfirmReset(true)} />
          ) : (
            <View>
              <Text style={[styles.body, { marginTop: 8, fontWeight: '700', color: COLORS.red }]}>
                Reset everything? Your rank, Coins, and partners will be gone. This can’t be undone.
              </Text>
              <Btn label="Cancel" onPress={() => setConfirmReset(false)} />
              <Btn
                label="Reset"
                primary
                onPress={() => {
                  resetAll();
                  router.replace('/');
                }}
              />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Wordmark size={32} />
          <Text style={[styles.body, { marginTop: 8 }]}>Backyard Spades v1.0.0</Text>
          <Text style={styles.body}>
            Backyard Spades is a points-based family card game. No real-money gambling, no prizes, no
            in-app purchases of currency.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
