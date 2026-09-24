import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { duration, easeOut } from '../../theme/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** En web los animatedProps de SVG no son confiables: se dibuja directo al valor final. */
const ANIMATE = Platform.OS !== 'web';

/** Progreso 0 → 1 que se reinicia cuando cambia `key` (datos nuevos). */
function useDraw(key: string, delay = 0) {
  const p = useSharedValue(ANIMATE ? 0 : 1);
  useEffect(() => {
    if (!ANIMATE) return;
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: duration.chart, easing: easeOut }));
  }, [key, delay, p]);
  return p;
}

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

function polyLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return l * 1.08; // la curva es un poco más larga que la poligonal
}

// ── AreaChart: línea con degradado de color que se "dibuja" al aparecer ────

export function AreaChart({
  data, labels, height = 140, colors: stroke, labelColor, highlightIndex, id = 'area',
}: {
  data: number[];
  labels?: string[];
  height?: number;
  /** Degradado del trazo (izquierda → derecha). */
  colors?: readonly [string, string];
  labelColor?: string;
  highlightIndex?: number;
  id?: string;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const [c0, c1] = stroke ?? colors.chartLine;
  const pad = 10;
  const inset = 10;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const { pts, line, area, len } = useMemo(() => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const span = max - min || 1;
    const pts: Pt[] = data.map((v, i) => ({
      x: data.length === 1 ? w / 2 : inset + (i / (data.length - 1)) * (w - inset * 2),
      y: pad + (1 - (v - min) / span) * (height - pad * 2),
    }));
    const line = smoothPath(pts);
    const area = pts.length > 1 ? `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z` : '';
    return { pts, line, area, len: polyLength(pts) };
  }, [data, w, height]);

  const draw = useDraw(`${data.join(',')}-${w}`);
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - draw.value) }));
  const areaProps = useAnimatedProps(() => ({ opacity: draw.value }));
  const dotProps = useAnimatedProps(() => ({ r: 5 * Math.max(0, (draw.value - 0.7) / 0.3) }));
  const hi = highlightIndex != null ? pts[highlightIndex] : undefined;

  return (
    <View onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <SvgGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={c0} />
              <Stop offset="1" stopColor={c1} />
            </SvgGradient>
            <SvgGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c1} stopOpacity={0.35} />
              <Stop offset="0.6" stopColor={c0} stopOpacity={0.12} />
              <Stop offset="1" stopColor={c0} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <AnimatedPath d={area} fill={`url(#${id}-fill)`} animatedProps={areaProps} />
          <AnimatedPath
            d={line}
            stroke={`url(#${id}-stroke)`}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${len} ${len}`}
            animatedProps={lineProps}
          />
          {hi && (
            <>
              <Circle cx={hi.x} cy={hi.y} r={11} fill={c1} opacity={0.18} />
              <AnimatedCircle cx={hi.x} cy={hi.y} fill={colors.card} stroke={c1} strokeWidth={3} animatedProps={dotProps} />
            </>
          )}
        </Svg>
      )}
      {labels && (
        <View style={c.labels}>
          {labels.map((l, i) => (
            <Text key={i} style={[c.label, {
              color: labelColor ?? (i === highlightIndex ? colors.text : colors.subtext),
              opacity: labelColor && i !== highlightIndex ? 0.7 : 1,
              fontWeight: i === highlightIndex ? '800' : '600',
            }]}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Sparkline mínima ────────────────────────────────────────────────────────

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

// ── Gauge (arco 270°) con trazo degradado y barrido animado ────────────────

function arcPath(cx: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cx + r * Math.sin(toRad(startDeg)) };
  const e = { x: cx + r * Math.cos(toRad(endDeg)), y: cx + r * Math.sin(toRad(endDeg)) };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function Gauge({
  value, size = 116, stroke = 11, colors: grad, children, id = 'gauge',
}: {
  value: number; size?: number; stroke?: number; colors?: readonly [string, string]; children?: React.ReactNode; id?: string;
}) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const [g0, g1] = grad ?? colors.chartLine;
  const len = r * (270 * Math.PI / 180);
  const draw = useDraw(`${v}`, 120);
  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - v * draw.value) }));
  const knobProps = useAnimatedProps(() => {
    const deg = -135 + 270 * v * draw.value;
    const rad = ((deg - 90) * Math.PI) / 180;
    return { cx: cx + r * Math.cos(rad), cy: cx + r * Math.sin(rad) };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={g0} />
            <Stop offset="1" stopColor={g1} />
          </SvgGradient>
        </Defs>
        <Path d={arcPath(cx, r, -135, 135)} stroke={colors.separator} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {v > 0.001 && (
          <>
            <AnimatedPath
              d={arcPath(cx, r, -135, 135)}
              stroke={`url(#${id})`}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${len} ${len}`}
              animatedProps={arcProps}
            />
            <AnimatedCircle r={stroke / 2 + 2} fill={colors.card} stroke={g1} strokeWidth={3} animatedProps={knobProps} />
          </>
        )}
      </Svg>
      {children}
    </View>
  );
}

// ── Dona por categorías (segmentos a color que se despliegan) ──────────────

function DonutSegment({
  cx, r, stroke, color, offset, dash, circ, progress,
}: {
  cx: number; r: number; stroke: number; color: string; offset: number; dash: number; circ: number;
  progress: ReturnType<typeof useDraw>;
}) {
  const props = useAnimatedProps(() => {
    const d = Math.max(dash * progress.value, 0.01);
    return { strokeDasharray: [d, circ - d], strokeDashoffset: -offset * progress.value };
  });
  return (
    <AnimatedCircle
      cx={cx} cy={cx} r={r}
      stroke={color} strokeWidth={stroke} fill="none"
      strokeLinecap="round"
      transform={`rotate(-90 ${cx} ${cx})`}
      animatedProps={props}
    />
  );
}

export function Donut({
  segments, size = 190, stroke = 22, children,
}: {
  segments: { value: number; color: string }[]; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((t, s) => t + s.value, 0);
  const gap = segments.length > 1 ? stroke * 0.9 : 0; // hueco que compensa las puntas redondeadas
  const progress = useDraw(segments.map(s => s.value.toFixed(2)).join(','), 150);

  let acc = 0;
  const arcs = segments.map(seg => {
    const len = total > 0 ? (seg.value / total) * circ : 0;
    const out = { color: seg.color, offset: acc, dash: Math.max(len - gap, 0.5) };
    acc += len;
    return out;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.separator} strokeWidth={stroke} fill="none" />
        {total > 0 && arcs.map((a, i) => (
          <DonutSegment key={i} cx={size / 2} r={r} stroke={stroke} color={a.color} offset={a.offset} dash={a.dash} circ={circ} progress={progress} />
        ))}
      </Svg>
      {children}
    </View>
  );
}

// ── Barra de progreso animada (con color sólido o degradado) ────────────────

export function ProgressBar({
  value, color, colors: grad, height = 8, delay = 0, style,
}: {
  value: number; color?: string; colors?: readonly [string, string]; height?: number; delay?: number; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  const w = useSharedValue(ANIMATE ? 0 : v);
  useEffect(() => {
    w.value = ANIMATE ? withDelay(delay, withTiming(v, { duration: duration.slow, easing: easeOut })) : v;
  }, [v, delay, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[{ height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: colors.separator }, style]}>
      <Animated.View style={[{ height, borderRadius: height / 2, overflow: 'hidden' }, fill]}>
        {grad
          ? <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: color ?? colors.ink }]} />}
      </Animated.View>
    </View>
  );
}

const c = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 12, textAlign: 'center', minWidth: 22 },
});
