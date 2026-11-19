// Renders a fixed-size design composition (e.g. the 390×252 table scene)
// scaled to fit the available width, keeping pixel positions from the design.
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { PHONE_W } from '../constants/theme';

export const useColumnWidth = () => {
  const { width } = useWindowDimensions();
  return Math.min(width, PHONE_W);
};

export const Scaled: React.FC<{ w: number; h: number; maxH?: number; children: React.ReactNode }> = ({ w, h, maxH, children }) => {
  const col = useColumnWidth();
  const s = Math.min(col / w, 1.1, maxH ? maxH / h : Infinity);
  return (
    <View style={{ width: w * s, height: h * s, alignSelf: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: w,
          height: h,
          left: (w * s - w) / 2,
          top: (h * s - h) / 2,
          transform: [{ scale: s }],
        }}
      >
        {children}
      </View>
    </View>
  );
};
