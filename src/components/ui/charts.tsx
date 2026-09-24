import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

// ── Curva suave (Catmull-Rom → Bézier) ──────────────────────────────────────

type Pt = { x: number; y: number };

function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── AreaChart: línea suave con relleno degradado (estilo "Total Balance") ───

export function AreaChart({
  data, labels, height = 140, color, labelColor, highlightIndex, showDots = true, id = 'area',
}: {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  /** Color de etiquetas (útil sobre fondos con gradiente). */
  labelColor?: string;
  highlightIndex?: number;
  showDots?: boolean;
  id?: string;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const stroke = color ?? colors.accent;
  const pad = 8;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const inset = 10; // evita que el punto resaltado se recorte en los bordes
  const pts: Pt[] = data.map((v, i) => ({
    x: data.length === 1 ? w / 2 : inset + (i / (data.length - 1)) * (w - inset * 2),
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const line = smoothPath(pts);
  const area = pts.length > 1 ? `${line} L ${w} ${height} L 0 ${height} Z` : '';
  const hi = highlightIndex != null ? pts[highlightIndex] : undefined;

  return (
    <View onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <SvgGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.45} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0.02} />
            </SvgGradient>
          </Defs>
          <Path d={area} fill={`url(#${id}-fill)`} />
          <Path d={line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {showDots && pts.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={i === highlightIndex ? 0 : 2.5} fill={stroke} />
          ))}
          {hi && (
            <>
              <Circle cx={hi.x} cy={hi.y} r={9} fill={stroke} opacity={0.2} />
              <Circle cx={hi.x} cy={hi.y} r={5} fill={colors.bg} stroke={stroke} strokeWidth={3} />
            </>
          )}
        </Svg>
      )}
      {labels && (
        <View style={c.labels}>
          {labels.map((l, i) => (
            <Text key={i} style={[c.label, { color: labelColor ?? (i === highlightIndex ? colors.text : colors.subtext), opacity: labelColor && i !== highlightIndex ? 0.75 : 1, fontWeight: i === highlightIndex ? '900' : '700' }]}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Sparkline mínima para tiles ─────────────────────────────────────────────

export function Sparkline({ data, color, width = 64, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: 2 + (1 - (v - min) / span) * (height - 4),
  }));
  return (
    <Svg width={width} height={height}>
      <Path d={smoothPath(pts)} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ── Gauge (arco 270°) estilo "What Experts Says" ────────────────────────────

function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const e = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function Gauge({
  value, size = 110, stroke = 10, color, children,
}: {
  value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const start = -135;
  const end = 135;
  const cur = start + (end - start) * v;
  const col = color ?? colors.accent;
  const endRad = ((cur - 90) * Math.PI) / 180;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Path d={arc(cx, cx, r, start, end)} stroke={colors.separator} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {v > 0.001 && <Path d={arc(cx, cx, r, start, cur)} stroke={col} strokeWidth={stroke} fill="none" strokeLinecap="round" />}
        {v > 0.001 && <Circle cx={cx + r * Math.cos(endRad)} cy={cx + r * Math.sin(endRad)} r={stroke / 2 + 2} fill={colors.bg} stroke={col} strokeWidth={3} />}
      </Svg>
      {children}
    </View>
  );
}

// ── Dona por categorías ─────────────────────────────────────────────────────

export function Donut({
  segments, size = 180, stroke = 26, children,
}: {
  segments: { value: number; color: string }[]; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((t, s) => t + s.value, 0);
  const gap = segments.length > 1 ? 4 : 0;
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.separator} strokeWidth={stroke} fill="none" />
        {total > 0 && segments.map((seg, i) => {
          const len = (seg.value / total) * circ;
          const dash = Math.max(len - gap, 0.1);
          const offset = -acc;
          acc += len;
          return (
            <Circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              stroke={seg.color} strokeWidth={stroke} fill="none"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

const c = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 12, textAlign: 'center', minWidth: 22 },
});
