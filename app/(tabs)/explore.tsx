import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import BudgetModal from '../../src/components/BudgetModal';
import {
  AnimatedNumber, AreaChart, Donut, EmptyState, Gauge, LargeTitle, ProgressBar, ScreenBackground,
  SectionHeader, TOP_BAR_H, TopBar, useScreenScroll, useTabBarSpace, type IoniconName,
} from '../../src/components/ui';
import { SubIcon, brandColor } from '../../src/utils/brandIcons';
import { monthlyEquivalent, MONTHS_SHORT, totalForMonth } from '../../src/utils/dates';
import { money, moneyShort, pluralize } from '../../src/utils/format';
import { enter } from '../../src/theme/motion';
import { radius, spacing, type } from '../../src/theme/tokens';
import {
  CATEGORY_LABELS, CATEGORY_VIVID_INDEX, PAYMENT_METHOD_LABELS,
  type Category, type PaymentMethod, type Subscription,
} from '../../src/types';

type Tip = { icon: IoniconName; title: string; body: string; tint: string };

export default function StatisticsScreen() {
  const { subscriptions, loading, monthlyTotal, yearlyTotal, budget } = useSubscriptions();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { scrollY, onScroll } = useScreenScroll();
  const [budgetOpen, setBudgetOpen] = useState(false);

  // Próximos 12 meses de cobros reales
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { label: MONTHS_SHORT[d.getMonth()], value: totalForMonth(subscriptions, d.getFullYear(), d.getMonth()) };
    });
  }, [subscriptions]);
  const peak = months.reduce((best, m, i) => (m.value > months[best].value ? i : best), 0);

  const segments = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    for (const sub of subscriptions) map[sub.category] = (map[sub.category] ?? 0) + monthlyEquivalent(sub);
    return (Object.entries(map) as [Category, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({ cat, label: CATEGORY_LABELS[cat], color: colors.vivid[CATEGORY_VIVID_INDEX[cat]], value: total }));
  }, [subscriptions, colors]);

  const top = useMemo(
    () => [...subscriptions].sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a)).slice(0, 5),
    [subscriptions],
  );

  const monthlyShare = monthlyTotal > 0
    ? subscriptions.filter(s => s.billing_cycle === 'monthly').reduce((t, s) => t + s.price, 0) / monthlyTotal
    : 0;

  const tips: Tip[] = useMemo(() => {
    const out: Tip[] = [];
    const monthlySubs = subscriptions.filter(s => s.billing_cycle === 'monthly');
    if (monthlySubs.length > 0) {
      const savings = monthlySubs.reduce((sum, s) => sum + s.price * 12 * 0.17, 0);
      out.push({
        icon: 'trending-down', tint: colors.success,
        title: 'Paga anual y ahorra',
        body: `Pasar ${pluralize(monthlySubs.length, 'plan mensual', 'planes mensuales')} a anual podría ahorrarte ~${moneyShort(savings)}/año (descuento típico del 17%).`,
      });
    }
    const counts: Partial<Record<Category, number>> = {};
    for (const sub of subscriptions) counts[sub.category] = (counts[sub.category] ?? 0) + 1;
    const dup = (Object.entries(counts) as [Category, number][]).find(([, n]) => n >= 2);
    if (dup) {
      out.push({
        icon: 'layers', tint: colors.vivid[CATEGORY_VIVID_INDEX[dup[0]]],
        title: `${dup[1]} servicios de ${CATEGORY_LABELS[dup[0]]}`,
        body: '¿Los usas todos? Rotar servicios (uno por mes) es una forma fácil de ahorrar.',
      });
    }
    if (budget > 0 && monthlyTotal > budget) {
      out.push({
        icon: 'warning', tint: colors.urgent,
        title: 'Te pasaste del presupuesto',
        body: `Vas ${moneyShort(monthlyTotal - budget)} arriba de tu límite mensual de ${moneyShort(budget)}.`,
      });
    }
    return out;
  }, [subscriptions, monthlyTotal, budget, colors]);

  const byMethod = useMemo(() => {
    const map: Partial<Record<PaymentMethod, Subscription[]>> = {};
    for (const sub of subscriptions) (map[sub.payment_method] ??= []).push(sub);
    return (Object.entries(map) as [PaymentMethod, Subscription[]][])
      .map(([method, subs]) => ({ method, subs, total: subs.reduce((t, s) => t + monthlyEquivalent(s), 0) }))
      .sort((a, b) => b.total - a.total)
      .map((g, i) => ({ ...g, color: colors.vivid[(i + 4) % colors.vivid.length] }));
  }, [subscriptions, colors]);

  if (!loading && subscriptions.length === 0) {
    return (
      <View style={s.root}>
        <ScreenBackground scene="stats" />
        <View style={{ paddingTop: insets.top + 12 }}>
          <LargeTitle scrollY={scrollY} title="Estadísticas" />
          <EmptyState icon="pie-chart-outline" title="Sin datos aún" body="Agrega suscripciones para ver tus gráficas y recomendaciones de ahorro." cta="Agregar suscripción" onCta={() => router.push('/subscription/new')} />
        </View>
      </View>
    );
  }

  const budgetPct = budget > 0 ? monthlyTotal / budget : 0;
  const budgetColors = budgetPct > 1 ? colors.chartBad : budgetPct > 0.8 ? colors.chartWarn : colors.chartGood;
  const maxTop = top[0] ? monthlyEquivalent(top[0]) : 1;
  const methodTotal = byMethod.reduce((t, g) => t + g.total, 0) || 1;
  const card = { backgroundColor: colors.surface, borderColor: colors.cardBorder };

  return (
    <View style={s.root}>
      <ScreenBackground scene="stats" />
      <BudgetModal visible={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <TopBar scrollY={scrollY} title="Estadísticas" />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + TOP_BAR_H - 12, paddingBottom: bottom }}
      >
        <LargeTitle scrollY={scrollY} title="Estadísticas" />

        {/* Hero anual */}
        <Animated.View entering={enter(0)} style={[s.hero, card]}>
          <Text style={[s.heroLabel, { color: colors.subtext }]}>Gasto anual estimado</Text>
          <AnimatedNumber value={yearlyTotal} format={moneyShort} style={[s.heroAmount, { color: colors.text }]} />
          <Text style={[s.heroSub, { color: colors.subtext }]}>{money(monthlyTotal)}/mes · {pluralize(subscriptions.length, 'suscripción', 'suscripciones')}</Text>
          <View style={{ marginTop: 16 }}>
            <AreaChart
              id="stats"
              data={months.map(m => m.value)}
              labels={months.map((m, i) => (i % 2 === 0 ? m.label : ''))}
              highlightIndex={peak}
              height={120}
            />
          </View>
          <View style={[s.peakChip, { backgroundColor: colors.vivid[1] + '22' }]}>
            <Ionicons name="flame" size={13} color={colors.vivid[1]} />
            <Text style={[s.peakText, { color: colors.text }]}>Mes más caro: {months[peak]?.label} · {moneyShort(months[peak]?.value ?? 0)}</Text>
          </View>
        </Animated.View>

        {/* Gauges */}
        <Animated.View entering={enter(1)} style={s.gauges}>
          <Pressable onPress={() => setBudgetOpen(true)} style={[s.gaugeCard, card]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>Presupuesto</Text>
            <Gauge id="g-budget" value={budgetPct} colors={budgetColors}>
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.round(budgetPct * 100)}%</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>de {moneyShort(budget)} ✎</Text>
          </Pressable>
          <View style={[s.gaugeCard, card]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>Mensuales</Text>
            <Gauge id="g-monthly" value={monthlyShare} colors={colors.chartLine}>
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.round(monthlyShare * 100)}%</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>vs. anuales</Text>
          </View>
        </Animated.View>

        {/* Dona por categoría */}
        <Animated.View entering={enter(2)}>
          <SectionHeader title="Por categoría" />
          <View style={[s.card, card]}>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <Donut segments={segments.map(sg => ({ value: sg.value, color: sg.color }))}>
                <AnimatedNumber value={monthlyTotal} format={moneyShort} style={[s.donutValue, { color: colors.text }]} />
                <Text style={[s.donutLabel, { color: colors.subtext }]}>por mes</Text>
              </Donut>
            </View>
            {segments.map((sg, i) => (
              <View key={sg.cat} style={s.legend}>
                <View style={s.legendTop}>
                  <View style={[s.legendDot, { backgroundColor: sg.color }]} />
                  <Text style={[s.legendLabel, { color: colors.text }]}>{sg.label}</Text>
                  <Text style={[s.legendAmt, { color: colors.subtext }]}>{money(sg.value)}</Text>
                  <Text style={[s.legendPct, { color: sg.color }]}>{monthlyTotal > 0 ? Math.round((sg.value / monthlyTotal) * 100) : 0}%</Text>
                </View>
                <ProgressBar value={monthlyTotal > 0 ? sg.value / monthlyTotal : 0} color={sg.color} height={5} delay={200 + i * 80} />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Ranking con colores de marca */}
        <Animated.View entering={enter(3)}>
          <SectionHeader title="Las más caras" />
          <View style={[s.card, card, { gap: 16 }]}>
            {top.map((sub, i) => {
              const tint = brandColor(sub.name, sub.color, colors.vivid, i);
              return (
                <Pressable key={sub.id} onPress={() => router.push(`/subscription/${sub.id}`)} style={s.rank}>
                  <SubIcon name={sub.name} color={sub.color} icon={sub.icon} size={40} borderRadius={20} />
                  <View style={{ flex: 1, gap: 7 }}>
                    <View style={s.rankTop}>
                      <Text style={[type.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>{sub.name}</Text>
                      <Text style={[s.rankAmt, { color: colors.text }]}>{money(monthlyEquivalent(sub))}</Text>
                    </View>
                    <ProgressBar value={monthlyEquivalent(sub) / maxTop} colors={[tint + '99', tint]} height={7} delay={250 + i * 90} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Métodos de pago: barra apilada */}
        <Animated.View entering={enter(4)}>
          <SectionHeader title="Por método de pago" />
          <View style={[s.card, card]}>
            <View style={s.stack}>
              {byMethod.map(g => (
                <View key={g.method} style={{ flex: g.total / methodTotal, backgroundColor: g.color }} />
              ))}
            </View>
            {byMethod.map(g => (
              <View key={g.method} style={s.method}>
                <View style={[s.legendDot, { backgroundColor: g.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyBold, { color: colors.text }]}>{PAYMENT_METHOD_LABELS[g.method]}</Text>
                  <Text style={[s.methodSubs, { color: colors.subtext }]} numberOfLines={1}>{g.subs.map(x => x.name).join(', ')}</Text>
                </View>
                <Text style={[s.rankAmt, { color: colors.text }]}>{money(g.total)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Tips */}
        {tips.length > 0 && (
          <Animated.View entering={enter(5)}>
            <SectionHeader title="Puedes optimizar" />
            <View style={{ gap: 10, marginHorizontal: spacing.screen }}>
              {tips.map(tip => (
                <View key={tip.title} style={[s.tip, card]}>
                  <View style={[s.tipIcon, { backgroundColor: tip.tint + '26' }]}>
                    <Ionicons name={tip.icon} size={20} color={tip.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyBold, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[s.tipBody, { color: colors.subtext }]}>{tip.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: { marginHorizontal: spacing.screen, borderRadius: radius.xl, padding: 20, paddingBottom: 16, borderWidth: StyleSheet.hairlineWidth },
  heroLabel: { fontSize: 14, fontWeight: '500' },
  heroAmount: { ...type.display, marginTop: 2 },
  heroSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  peakChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginTop: 12 },
  peakText: { fontSize: 12, fontWeight: '600' },

  gauges: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 12 },
  gaugeCard: { flex: 1, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth },
  gaugeTitle: { fontSize: 15, fontWeight: '700', alignSelf: 'flex-start', marginLeft: 16 },
  gaugeValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  gaugeFoot: { fontSize: 13, fontWeight: '500' },

  card: { marginHorizontal: spacing.screen, borderRadius: radius.lg, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  donutValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  donutLabel: { fontSize: 12, fontWeight: '500' },
  legend: { paddingVertical: 8, gap: 7 },
  legendTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  legendAmt: { fontSize: 13, fontWeight: '500' },
  legendPct: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },

  rank: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankAmt: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },

  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 3, marginBottom: 8 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  methodSubs: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  tip: { flexDirection: 'row', gap: 12, borderRadius: radius.md, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tipBody: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginTop: 3 },
});
