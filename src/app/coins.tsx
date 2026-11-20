// Coin Shop — buy Coin packs. MOCK for now: prices are placeholders and no
// payment is taken; confirming a pack just adds its Coins. Real purchases
// (App Store / Google Play in-app purchases, Stripe on the web) replace the
// confirm step later — see src/constants/shop.ts.
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { goBack } from '../navigation';
import { BtnP, BtnS, Coin, Header, Note, Panel, Screen, Sheet, T, Toast, coinsText, usePalette } from '../components/ui';
import { COLORS } from '../constants/theme';
import { COIN_PACKS, formatUsd, type CoinPack } from '../constants/shop';
import { useApp } from '../state/store';

const CoinStack: React.FC<{ n: number }> = ({ n }) => (
  <View style={{ width: 56, height: 44, alignItems: 'center', justifyContent: 'flex-end' }}>
    {Array.from({ length: n }).map((_, i) => (
      <View key={i} style={{ position: 'absolute', bottom: i * 6, left: 12 + (i % 2) * 6 }}>
        <Coin size={26} />
      </View>
    ))}
  </View>
);

export default function CoinShop() {
  const { profile, addCoins } = useApp();
  const pal = usePalette();
  const [pending, setPending] = useState<CoinPack | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Screen
      header={
        <Header
          title="COIN SHOP"
          onBack={() => goBack()}
          right={
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Coin />
              <T x size={13}>
                {coinsText(profile.coins)} Coins
              </T>
            </View>
          }
        />
      }
      contentStyle={{ paddingTop: 6, gap: 12 }}
      overlay={
        <>
          <Sheet visible={!!pending} onClose={() => setPending(null)}>
            {pending ? (
              <>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <CoinStack n={pending.stack} />
                  <View style={{ flex: 1 }}>
                    <T x size={18}>
                      {pending.name}: {pending.coins + pending.bonus} Coins
                    </T>
                    <T size={14}>{formatUsd(pending.usd)}</T>
                  </View>
                </View>
                <Note>Preview only — no real payment is taken. Your Coins are added straight away.</Note>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <BtnS label="Cancel" onPress={() => setPending(null)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BtnP
                      label="BUY"
                      size={12}
                      testID="confirm-coin-pack"
                      onPress={() => {
                        addCoins(pending.coins + pending.bonus);
                        setToast(`+${pending.coins + pending.bonus} Coins`);
                        setPending(null);
                      }}
                    />
                  </View>
                </View>
              </>
            ) : null}
          </Sheet>
          <Toast text={toast} />
        </>
      }
    >
      <T size={14}>Coins buy partners and Shed items. You also earn them by playing.</T>
      {COIN_PACKS.map((pack) => (
        <Pressable
          key={pack.id}
          onPress={() => setPending(pack)}
          accessibilityRole="button"
          accessibilityLabel={`${pack.name}, ${pack.coins + pack.bonus} Coins for ${formatUsd(pack.usd)}`}
        >
          <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }} picked={pack.tag === 'Best value'}>
            <CoinStack n={pack.stack} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <T x size={16}>
                  {pack.name}
                </T>
                {pack.tag ? (
                  <View style={{ backgroundColor: COLORS.sun, borderWidth: 2, borderColor: COLORS.ink, borderRadius: 10, paddingHorizontal: 6 }}>
                    <T x fixed size={11}>
                      {pack.tag}
                    </T>
                  </View>
                ) : null}
              </View>
              <T px size={12} style={{ marginTop: 2 }}>
                {pack.coins} Coins
              </T>
              {pack.bonus > 0 ? (
                <T x size={12} color={pal.ok}>
                  +{pack.bonus} bonus
                </T>
              ) : null}
            </View>
            <View
              style={{
                backgroundColor: pal.tomato,
                borderWidth: 3,
                borderColor: COLORS.ink,
                borderRadius: 6,
                paddingVertical: 8,
                paddingHorizontal: 10,
                boxShadow: `0 3px 0 ${COLORS.ink}`,
              }}
            >
              <T px fixed size={11} color="#fff">
                {formatUsd(pack.usd)}
              </T>
            </View>
          </Panel>
        </Pressable>
      ))}
      <T size={12} center style={{ opacity: 0.85 }}>
        Prices are a preview. Coins never turn back into money, and you can’t win money in Backyard Spades.
      </T>
    </Screen>
  );
}
