import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { isExpoGo } from '../../src/utils/env';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  type Category,
  type PaymentMethod,
  type Subscription,
} from '../../src/types';

// ── Donut chart constants ───────────────────────────────────────────────────────
const DONUT = 188;
const SW = 34;
const R = (DONUT - SW) / 2;
const CIRC = 2 * Math.PI * R;
const CX = DONUT / 2;
const CY = DONUT / 2;

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const BAR_MAX_H = 88;

// ── Helpers ────────────────────────────────────────────────────────────────────

function monthlyFromSub(sub: Subscription): number {
  return sub.billing_cycle === 'yearly' ? sub.price / 12 : sub.price;
}

function getMonthlyProjections(subs: Subscription[]): number[] {
  const months = new Array(12).fill(0) as number[];
  for (const sub of subs) {
    if (sub.billing_cycle === 'monthly') {
      for (let m = 0; m < 12; m++) months[m] += sub.price;
    } else {
      const m = new Date(sub.next_renewal + 'T12:00:00').getMonth();
      months[m] += sub.price;
    }
  }
  return months;
}

// ── Donut chart ────────────────────────────────────────────────────────────────

type Segment = { category: Category; label: string; color: string; total: number };

function DonutChart({
  segments, total, colors,
}: {
  segments: Segment[];
  total: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  let cumulative = 0;
  return (
    <Svg width={DONUT} height={DONUT}>
      <Circle cx={CX} cy={CY} r={R} fill="none" stroke={colors.separator} strokeWidth={SW} />
      {total > 0 && segments.map((seg, i) => {
        const pct = seg.total / total;
        const dash = CIRC * pct;
        const rot = -90 + cumulative * 360;
        cumulative += pct;
        return (
          <Circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={SW - 2}
            strokeDasharray={`${dash} ${CIRC - dash}`}
            transform={`rotate(${rot}, ${CX}, ${CY})`}
          />
        );
      })}
      <SvgText x={CX} y={CY - 10} textAnchor="middle" fontSize={22} fontWeight="700" fill={colors.text}>{`$${total.toFixed(0)}`}</SvgText>
      <SvgText x={CX} y={CY + 12} textAnchor="middle" fontSize={12} fill={colors.subtext}>{'por mes'}</SvgText>
    </Svg>
  );
}

// ── Monthly bar chart ──────────────────────────────────────────────────────────

function MonthlyBars({
  data, colors,
}: {
  data: number[];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const max = Math.max(...data, 0.01);
  const currentMonth = new Date().getMonth();

  return (
    <View style={s.barsRow}>
      {data.map((val, i) => {
        const barH = Math.max((val / max) * BAR_MAX_H, val > 0 ? 4 : 0);
        const isNow = i === currentMonth;
        return (
          <View key={i} style={s.barCol}>
            <View style={[s.barTrack, { height: BAR_MAX_H }]}>
              <View style={[s.barFill, { height: barH, backgroundColor: isNow ? colors.primary : colors.accentSoft }]} />
            </View>
            {val > 0 && (
              <Text style={[s.barVal, { color: isNow ? colors.primary : colors.subtext }]}>
                ${Math.round(val)}
              </Text>
            )}
            <Text style={[s.barMon, { color: isNow ? colors.primary : colors.subtext, fontWeight: isNow ? '700' : '400' }]}>
              {MONTH_SHORT[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function StatisticsScreen() {
  const { subscriptions, loading, monthlyTotal } = useSubscriptions();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  const annualTotal = monthlyTotal * 12;

  const segments: Segment[] = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    for (const sub of subscriptions) {
      const m = monthlyFromSub(sub);
      map[sub.category] = (map[sub.category] ?? 0) + m;
    }
    return (Object.entries(map) as [Category, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        color: CATEGORY_COLORS[cat],
        total,
      }));
  }, [subscriptions]);

  const monthlyProj = useMemo(() => getMonthlyProjections(subscriptions), [subscriptions]);

  type Tip = { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string; accent: string };
  const tips: Tip[] = useMemo(() => {
    const result: Tip[] = [];
    const monthlySubs = subscriptions.filter(s => s.billing_cycle === 'monthly');
    if (monthlySubs.length > 0) {
      const savings = monthlySubs.reduce((sum, s) => sum + s.price * 12 * 0.17, 0);
      result.push({
        icon: 'trending-down-outline',
        title: 'Paga anualmente y ahorra',
        body: `Cambiar tus ${monthlySubs.length} suscripción${monthlySubs.length > 1 ? 'es' : ''} mensual${monthlySubs.length > 1 ? 'es' : ''} a plan anual podría ahorrarte ~$${savings.toFixed(0)}/año (descuento típico del 17%).`,
        accent: '#10B981',
      });
    }
    const catCount: Partial<Record<Category, number>> = {};
    for (const sub of subscriptions) catCount[sub.category] = (catCount[sub.category] ?? 0) + 1;
    for (const [cat, count] of Object.entries(catCount) as [Category, number][]) {
      if (count >= 2) {
        result.push({
          icon: 'layers-outline',
          title: `${count} suscripciones en ${CATEGORY_LABELS[cat]}`,
          body: `¿Necesitas todas? Considera consolidar o cancelar alguna.`,
          accent: CATEGORY_COLORS[cat],
        });
        break;
      }
    }
    if (subscriptions.length > 0) {
      const top = [...subscriptions].sort((a, b) => monthlyFromSub(b) - monthlyFromSub(a))[0];
      const pct = monthlyTotal > 0 ? Math.round(monthlyFromSub(top) / monthlyTotal * 100) : 0;
      result.push({
        icon: 'star-outline',
        title: `${top.name} es tu mayor gasto`,
        body: `$${monthlyFromSub(top).toFixed(2)}/mes — representa el ${pct}% de tu gasto total mensual.`,
        accent: colors.accent,
      });
    }
    return result;
  }, [subscriptions, monthlyTotal, colors]);

  type PmGroup = { method: PaymentMethod; label: string; subs: Subscription[]; total: number };
  const pmGroups: PmGroup[] = useMemo(() => {
    const map: Partial<Record<PaymentMethod, Subscription[]>> = {};
    for (const sub of subscriptions) {
      if (!map[sub.payment_method]) map[sub.payment_method] = [];
      map[sub.payment_method]!.push(sub);
    }
    return (Object.entries(map) as [PaymentMethod, Subscription[]][])
      .map(([method, subs]) => ({
        method,
        label: PAYMENT_METHOD_LABELS[method],
        subs,
        total: subs.reduce((sum, s) => sum + monthlyFromSub(s), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [subscriptions]);

  if (!loading && subscriptions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
        <Text style={[s.sectionHeader, { color: colors.text, marginTop: 16 }]}>Estadísticas</Text>
        <View style={s.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={56} color={colors.subtext} />
          <Text style={[s.emptyText, { color: colors.subtext }]}>Sin datos aún</Text>
          <Text style={[s.emptyHint, { color: colors.subtext }]}>Agrega suscripciones para ver tus estadísticas</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isExpoGo ? insets.bottom + 90 : 24 }}
      >
        {/* ── Annual hero card ── */}
        <LinearGradient
          colors={dark ? ['#1E293B', '#0F172A'] : ['#111827', '#374151']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroDec1} />
          <View style={s.heroDec2} />
          <View style={s.heroTitleRow}>
            <Text style={s.heroScreenTitle}>Estadísticas</Text>
            <View style={s.heroIconWrap}>
              <Ionicons name="bar-chart-outline" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
          <Text style={s.heroTagline}>Gasto anual estimado</Text>
          <Text style={s.heroAmount}>${annualTotal.toFixed(2)}</Text>
          <Text style={s.heroSub}>
            {subscriptions.length} suscripción{subscriptions.length !== 1 ? 'es' : ''} · ${monthlyTotal.toFixed(2)}/mes
          </Text>
        </LinearGradient>

        {/* ── Donut + legend ── */}
        <Text style={[s.sectionHeader, { color: colors.subtext }]}>Distribución de gasto</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={s.donutCenter}>
            <DonutChart segments={segments} total={monthlyTotal} colors={colors} />
          </View>
          <View style={[s.legendList, { borderTopColor: colors.separator }]}>
            {segments.map((seg, i) => (
              <View key={seg.category}>
                {i > 0 && <View style={[s.sep, { backgroundColor: colors.separator }]} />}
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: seg.color }]} />
                  <Text style={[s.legendLabel, { color: colors.text }]}>{seg.label}</Text>
                  <Text style={[s.legendAmt, { color: colors.subtext }]}>${seg.total.toFixed(2)}/mes</Text>
                  <Text style={[s.legendPct, { color: seg.color }]}>
                    {monthlyTotal > 0 ? Math.round(seg.total / monthlyTotal * 100) : 0}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Monthly bars ── */}
        <Text style={[s.sectionHeader, { color: colors.text }]}>
          Gasto mensual {new Date().getFullYear()}
        </Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, padding: 16, paddingBottom: 10 }]}>
          <MonthlyBars data={monthlyProj} colors={colors} />
          <Text style={[s.barsNote, { color: colors.subtext }]}>
            Suscripciones mensuales aparecen cada mes. Las anuales solo en su mes de renovación.
          </Text>
        </View>

        {/* ── Optimization tips ── */}
        {tips.length > 0 && (
          <>
            <Text style={[s.sectionHeader, { color: colors.subtext }]}>Puedes optimizar</Text>
            <View style={s.tipsCol}>
              {tips.map((tip, i) => (
                <View key={i} style={[s.tipCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[s.tipIcon, { backgroundColor: tip.accent + '22' }]}>
                    <Ionicons name={tip.icon} size={20} color={tip.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[s.tipBody, { color: colors.subtext }]}>{tip.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Payment method breakdown — individual cards ── */}
        {pmGroups.length > 0 && (
          <>
            <Text style={[s.sectionHeader, { color: colors.subtext }]}>Por método de pago</Text>
            <View style={s.pmCardCol}>
              {pmGroups.map(group => (
                <View key={group.method} style={[s.pmCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[s.pmIconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="card-outline" size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.pmLabel, { color: colors.text }]}>{group.label}</Text>
                    <Text style={[s.pmSubs, { color: colors.subtext }]} numberOfLines={1}>
                      {group.subs.map(sub => sub.name).join(', ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[s.pmTotal, { color: colors.text }]}>${group.total.toFixed(2)}</Text>
                    <View style={[s.pmPeriodPill, { backgroundColor: colors.accentSoft }]}>
                      <Text style={[s.pmPeriod, { color: colors.accent }]}>por mes</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  sectionHeader: { fontSize: 17, fontWeight: '700', marginHorizontal: 16, marginTop: 24, marginBottom: 10 },
  card: { marginHorizontal: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  // Hero
  heroCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 24, padding: 22, gap: 4, overflow: 'hidden' },
  heroDec1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -50 },
  heroDec2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -30, left: 20 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroScreenTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginBottom: 2 },
  heroAmount: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  // Donut
  donutCenter: { alignItems: 'center', paddingVertical: 16 },
  legendList: { borderTopWidth: StyleSheet.hairlineWidth },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  legendAmt: { fontSize: 13 },
  legendPct: { fontSize: 14, fontWeight: '700', minWidth: 42, textAlign: 'right' },
  // Monthly bars
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barCol: { flex: 1, alignItems: 'center', gap: 2 },
  barTrack: { justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  barFill: { width: '100%', borderRadius: 4 },
  barVal: { fontSize: 8, textAlign: 'center' },
  barMon: { fontSize: 9, textAlign: 'center' },
  barsNote: { fontSize: 11, marginTop: 12, lineHeight: 15, textAlign: 'center' },
  // Tips
  tipsCol: { marginHorizontal: 16, gap: 10 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  tipBody: { fontSize: 13, lineHeight: 18 },
  // Payment method — individual cards
  pmCardCol: { marginHorizontal: 16, gap: 10 },
  pmCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  pmIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pmLabel: { fontSize: 15, fontWeight: '600' },
  pmSubs: { fontSize: 12, marginTop: 2 },
  pmTotal: { fontSize: 16, fontWeight: '800' },
  pmPeriodPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  pmPeriod: { fontSize: 10, fontWeight: '600' },
  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 17, fontWeight: '600' },
  emptyHint: { fontSize: 14, textAlign: 'center', marginHorizontal: 32 },
});
