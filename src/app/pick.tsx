// Pick Your Partner — one full-width partner card at a time in a swipeable
// carousel (‹ › arrows, "2 of 8", dots). Swiping onto a partner you own picks
// them; the sticky footer shows who you'll play with and START GAME.
import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '../navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { useColumnWidth } from '../components/Scaled';
import { PartnerCard } from '../components/PartnerCard';
import { BuySheet } from '../components/sheets';
import { Avatar, BtnP, DevBadge, Header, Screen, T, Toast, usePalette } from '../components/ui';
import { COLORS } from '../constants/theme';
import { PARTNERS, partnerById } from '../constants/partners';
import { useApp } from '../state/store';

const Arrow: React.FC<{ dir: -1 | 1; off: boolean; onPress: () => void }> = ({ dir, off, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={off}
    accessibilityRole="button"
    accessibilityLabel={dir < 0 ? 'Previous partner' : 'Next partner'}
    style={{
      width: 48,
      height: 48,
      borderWidth: 3,
      borderColor: COLORS.ink,
      borderRadius: 8,
      backgroundColor: COLORS.paper,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: off ? 0.35 : 1,
      boxShadow: `0 3px 0 ${COLORS.ink}`,
    }}
  >
    <T px fixed size={16}>
      {dir < 0 ? '‹' : '›'}
    </T>
  </Pressable>
);

export default function Pick() {
  const { profile, rank, startGame, setPicked } = useApp();
  const params = useLocalSearchParams<{ partner?: string }>();
  const [buyId, setBuyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (params.partner) setPicked(params.partner);
  }, [params.partner, setPicked]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const picked = partnerById(profile.owned.includes(profile.picked) ? profile.picked : 'grandma');
  const view = (id: string) => router.push({ pathname: '/partner', params: { id } });

  const pal = usePalette();
  const pageW = useColumnWidth();
  const pager = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(() => Math.max(0, PARTNERS.findIndex((p) => p.id === picked.id)));
  const current = PARTNERS[index];

  // Open on the picked partner (and stay on it if the screen width changes).
  const placed = useRef(false);
  const onPagerLayout = () => {
    pager.current?.scrollTo({ x: index * pageW, animated: false });
    placed.current = true;
  };

  const settle = (i: number) => {
    const n = Math.max(0, Math.min(PARTNERS.length - 1, i));
    if (n === index) return;
    setIndex(n);
    if (profile.owned.includes(PARTNERS[n].id)) setPicked(PARTNERS[n].id);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!placed.current) return;
    settle(Math.round(e.nativeEvent.contentOffset.x / pageW));
  };
  const goTo = (i: number) => {
    const n = Math.max(0, Math.min(PARTNERS.length - 1, i));
    pager.current?.scrollTo({ x: n * pageW, animated: true });
    settle(n);
  };



  return (
    <Screen
      header={<Header title="PICK YOUR PARTNER" titleSize={13} subtitle="Who’s sitting across from you?" onBack={() => goBack()} />}
      contentStyle={{ paddingTop: 2, paddingHorizontal: 0, gap: 10 }}
      footer={
        <>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Avatar stem={picked.portrait} size={40} item={profile.equip[picked.id]} />
            <T x size={13} style={{ flex: 1 }}>
              {picked.name} — {picked.quirk}
            </T>
          </View>
          <BtnP
            label="START GAME"
            onPress={() => {
              startGame(picked.id);
              router.push('/game');
            }}
            testID="start-game"
          />
        </>
      }
      overlay={
        <>
          <BuySheet
            partnerId={buyId}
            onClose={() => setBuyId(null)}
            onBought={(id) => {
              setToast(`${partnerById(id).name} joined the family.`);
              setPicked(id);
            }}
          />
          <Toast text={toast} bottom={150} />
        </>
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        <DevBadge />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
        <Arrow dir={-1} off={index === 0} onPress={() => goTo(index - 1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T x size={15} center numberOfLines={1}>
            {current.name}
          </T>
          <T size={12} center>
            {index + 1} of {PARTNERS.length}
            {profile.owned.includes(current.id) ? '' : ' • locked'}
          </T>
        </View>
        <Arrow dir={1} off={index === PARTNERS.length - 1} onPress={() => goTo(index + 1)} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {PARTNERS.map((p, i) => (
          <Pressable key={p.id} onPress={() => goTo(i)} hitSlop={6}>
            <View
              style={{
                width: i === index ? 22 : 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: COLORS.ink,
                backgroundColor: i === index ? pal.tomato : profile.owned.includes(p.id) ? COLORS.paper : COLORS.toggleOff,
              }}
            />
          </Pressable>
        ))}
      </View>

      <ScrollView
        ref={pager}
        testID="partner-pager"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={onPagerLayout}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ width: pageW }}
      >
        {PARTNERS.map((p) => {
          const owned = profile.owned.includes(p.id);
          const canBuy = rank >= p.unlockRank && profile.coins >= p.price;
          return (
            <View key={p.id} style={{ width: pageW, paddingHorizontal: 16, paddingBottom: 8 }}>
              <PartnerCard
                wide
                partner={p}
                picked={picked.id === p.id}
                onTap={() => (owned ? setPicked(p.id) : view(p.id))}
                onAction={() => (owned ? setPicked(p.id) : canBuy ? setBuyId(p.id) : view(p.id))}
                onView={() => view(p.id)}
              />
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
