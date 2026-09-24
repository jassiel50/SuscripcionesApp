import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import BudgetModal from '../../src/components/BudgetModal';
import {
  AreaChart, Donut, EmptyState, Gauge, ScreenHeader, SectionHeader, useTabBarSpace, type IoniconName,
} from '../../src/components/ui';
import { SubIcon } from '../../src/utils/brandIcons';
import { monthlyEquivalent, MONTHS_SHORT, totalForMonth } from '../../src/utils/dates';
import { money, moneyParts, moneyShort, pluralize } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import {
  CATEGORY_LABELS, PAYMENT_METHOD_LABELS,
  type Category, type PaymentMethod, type Subscription,
} from '../../src/types';

type Tip = { icon: IoniconName; title: string; body: string; accent: string };

export default function StatisticsScreen() {
  const { subscriptions, loading, monthlyTotal, yearlyTotal, budget } = useSubscriptions();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBarSpace();
  const [budgetOpen, setBudgetOpen] = useState(false);

  // Próximos 12 meses, cobros reales
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
      .map(([cat, total], i) => ({ cat, label: CATEGORY_LABELS[cat], color: colors.chart[i % colors.chart.length], value: total }));
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
        icon: 'trending-down', accent: colors.ink,
        title: 'Paga anual y ahorra',
        body: `Pasar ${pluralize(monthlySubs.length, 'plan mensual', 'planes mensuales')} a anual podría ahorrarte ~${moneyShort(savings)}/año (descuento típico del 17%).`,
      });
    }
    const counts: Partial<Record<Category, number>> = {};
    for (const sub of subscriptions) counts[sub.category] = (counts[sub.category] ?? 0) + 1;
    const dup = (Object.entries(counts) as [Category, number][]).find(([, n]) => n >= 2);
    if (dup) {
      out.push({
        icon: 'layers', accent: colors.ink,
        title: `${dup[1]} servicios de ${CATEGORY_LABELS[dup[0]]}`,
        body: '¿Los usas todos? Rotar servicios (uno por mes) es una forma fácil de ahorrar.',
      });
    }
    if (budget > 0 && monthlyTotal > budget) {
      out.push({
        icon: 'warning', accent: colors.urgent,
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
      .sort((a, b) => b.total - a.total);
  }, [subscriptions]);

  if (!loading && subscriptions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
        <ScreenHeader title="Estadísticas" />
        <EmptyState icon="pie-chart-outline" title="Sin datos aún" body="Agrega suscripciones para ver tus gráficas y recomendaciones de ahorro." cta="Agregar suscripción" onCta={() => router.push('/subscription/new')} />
      </SafeAreaView>
    );
  }

  const { int, dec } = moneyParts(yearlyTotal);
  const budgetPct = budget > 0 ? monthlyTotal / budget : 0;
  const maxTop = top[0] ? monthlyEquivalent(top[0]) : 1;

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <BudgetModal visible={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <ScreenHeader title="Estadísticas" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom }}>
        {/* Hero anual con gráfica */}
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <Text style={[s.heroLabel, { color: colors.onInk }]}>Gasto anual estimado</Text>
          <Text style={[s.heroAmount, { color: colors.onInk }]}>{int}<Text style={s.heroDec}>.{dec}</Text></Text>
          <Text style={[s.heroSub, { color: colors.onInk }]}>{money(monthlyTotal)}/mes · {pluralize(subscriptions.length, 'suscripción', 'suscripciones')}</Text>
          <View style={{ marginTop: 14 }}>
            <AreaChart
              id="stats"
              data={months.map(m => m.value)}
              labels={months.map((m, i) => (i % 2 === 0 ? m.label : ''))}
              highlightIndex={peak}
              color={colors.onInk}
              labelColor={colors.onInk}
              height={100}
              showDots={false}
            />
          </View>
          <Text style={[s.heroFoot, { color: colors.onInk }]}>Mes más caro: {months[peak]?.label} · {moneyShort(months[peak]?.value ?? 0)}</Text>
        </LinearGradient>

        {/* Gauges */}
        <View style={s.gauges}>
          <Pressable onPress={() => setBudgetOpen(true)} style={[s.gaugeCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>Presupuesto</Text>
            <Gauge value={budgetPct} color={budgetPct > 1 ? colors.urgent : colors.ink}>
              <Ionicons name="wallet-outline" size={16} color={colors.subtext} />
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.round(budgetPct * 100)}%</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>de {moneyShort(budget)} ✎</Text>
          </Pressable>
          <View style={[s.gaugeCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>Mensuales</Text>
            <Gauge value={monthlyShare} color={colors.ink}>
              <Ionicons name="repeat" size={16} color={colors.subtext} />
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.round(monthlyShare * 100)}%</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>vs. anuales</Text>
          </View>
        </View>

        {/* Dona por categoría */}
        <SectionHeader title="Por categoría" />
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Donut segments={segments.map(sg => ({ value: sg.value, color: sg.color }))}>
              <Text style={[s.donutValue, { color: colors.text }]}>{moneyShort(monthlyTotal)}</Text>
              <Text style={[s.donutLabel, { color: colors.subtext }]}>por mes</Text>
            </Donut>
          </View>
          {segments.map(sg => (
            <View key={sg.cat} style={s.legend}>
              <View style={[s.legendDot, { backgroundColor: sg.color }]} />
              <Text style={[s.legendLabel, { color: colors.text }]}>{sg.label}</Text>
              <Text style={[s.legendAmt, { color: colors.subtext }]}>{money(sg.value)}</Text>
              <Text style={[s.legendPct, { color: sg.color }]}>{monthlyTotal > 0 ? Math.round((sg.value / monthlyTotal) * 100) : 0}%</Text>
            </View>
          ))}
        </View>

        {/* Ranking */}
        <SectionHeader title="Las más caras" />
        <View style={[s.card, { backgroundColor: colors.surface, gap: 14 }]}>
          {top.map((sub, i) => (
            <Pressable key={sub.id} onPress={() => router.push(`/subscription/${sub.id}`)} style={s.rank}>
              <Text style={[s.rankNum, { color: colors.muted }]}>{i + 1}</Text>
              <SubIcon name={sub.name} color={sub.color} size={38} borderRadius={19} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={s.rankTop}>
                  <Text style={[type.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>{sub.name}</Text>
                  <Text style={[s.rankAmt, { color: colors.text }]}>{money(monthlyEquivalent(sub))}</Text>
                </View>
                <View style={[s.rankTrack, { backgroundColor: colors.separator }]}>
                  <LinearGradient
                    colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.rankFill, { width: `${(monthlyEquivalent(sub) / maxTop) * 100}%` }]}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Tips */}
        {tips.length > 0 && (
          <>
            <SectionHeader title="Puedes optimizar" />
            <View style={{ gap: 10, marginHorizontal: spacing.screen }}>
              {tips.map(tip => (
                <View key={tip.title} style={[s.tip, { backgroundColor: colors.surface }]}>
                  <View style={[s.tipIcon, { backgroundColor: tip.accent === colors.urgent ? colors.urgentSoft : colors.bg }]}>
                    <Ionicons name={tip.icon} size={20} color={tip.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyBold, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[s.tipBody, { color: colors.subtext }]}>{tip.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Métodos de pago */}
        <SectionHeader title="Por método de pago" />
        <View style={[s.card, { backgroundColor: colors.surface, paddingVertical: 4 }]}>
          {byMethod.map((g, i) => (
            <View key={g.method} style={[s.method, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodyBold, { color: colors.text }]}>{PAYMENT_METHOD_LABELS[g.method]}</Text>
                <Text style={[s.methodSubs, { color: colors.subtext }]} numberOfLines={1}>{g.subs.map(x => x.name).join(', ')}</Text>
              </View>
              <Text style={[s.rankAmt, { color: colors.text }]}>{money(g.total)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: { marginHorizontal: spacing.screen, borderRadius: radius.xl, padding: 22, paddingBottom: 16 },
  heroLabel: { opacity: 0.7, fontSize: 14, fontWeight: '700' },
  heroAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1.4, marginTop: 2 },
  heroDec: { fontSize: 20, fontWeight: '800' },
  heroSub: { opacity: 0.75, fontSize: 13, fontWeight: '700', marginTop: 2 },
  heroFoot: { opacity: 0.75, fontSize: 12, fontWeight: '800', marginTop: 10, textAlign: 'center' },

  gauges: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 14 },
  gaugeCard: { flex: 1, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', gap: 6 },
  gaugeTitle: { fontSize: 15, fontWeight: '800', alignSelf: 'flex-start', marginLeft: 16 },
  gaugeValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  gaugeFoot: { fontSize: 13, fontWeight: '800' },

  card: { marginHorizontal: spacing.screen, borderRadius: radius.lg, padding: 16 },
  donutValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  donutLabel: { fontSize: 12, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  legendAmt: { fontSize: 13, fontWeight: '700' },
  legendPct: { fontSize: 14, fontWeight: '900', minWidth: 40, textAlign: 'right' },

  rank: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankNum: { width: 14, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankAmt: { fontSize: 15, fontWeight: '900' },
  rankTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  rankFill: { height: 6, borderRadius: 3 },

  tip: { flexDirection: 'row', gap: 12, borderRadius: radius.md, padding: 14 },
  tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tipBody: { fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 3 },

  method: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  methodSubs: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
