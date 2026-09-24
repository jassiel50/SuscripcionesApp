import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Tarjeta con "mordida" en la esquina superior derecha donde se aloja un botón
 * circular (el patrón de la referencia con el corazón). La forma se dibuja con
 * SVG para que las curvas cóncavas queden perfectas en iOS y Android.
 */
export function notchPath(w: number, h: number, notch: number, r = 28, rc = 22): string {
  const n = Math.min(notch, w / 2, h / 2);
  return [
    `M 0 ${r}`,
    `Q 0 0 ${r} 0`,
    `L ${w - n - rc} 0`,
    `Q ${w - n} 0 ${w - n} ${rc}`,
    `L ${w - n} ${n - rc}`,
    `Q ${w - n} ${n} ${w - n + rc} ${n}`,
    `L ${w - rc} ${n}`,
    `Q ${w} ${n} ${w} ${n + rc}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    'Z',
  ].join(' ');
}

type Props = {
  children: React.ReactNode;
  /** Nodo que se coloca centrado dentro de la muesca (normalmente un GradientCircle). */
  badge?: React.ReactNode;
  fill: string;
  notch?: number;
  style?: StyleProp<ViewStyle>;
};

export function NotchCard({ children, badge, fill, notch = 80, style }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <View style={[s.wrap, style]} onLayout={onLayout}>
      {size.w > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h}>
          <Path d={notchPath(size.w, size.h, notch)} fill={fill} />
        </Svg>
      )}
      {badge && (
        <View style={[s.badge, { width: notch, height: notch }]} pointerEvents="box-none">
          {badge}
        </View>
      )}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
});
