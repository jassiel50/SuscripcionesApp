import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import BudgetModal from '../../src/components/BudgetModal';
import {
  AreaChart, EmptyState, FeaturedSubscriptionCard, FilterPills, IconButton,
  PressableScale, SearchField, SectionHeader, SubscriptionRow, UpcomingTile, useTabBarSpace,
} from '../../src/components/ui';
import { daysUntilRenewal, greeting, MONTHS_SHORT, totalForMonth } from '../../src/utils/dates';
import { moneyParts, moneyShort, pluralize } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import type { Subscription } from '../../src/types';

type Filter = 'all' | 'monthly' | 'yearly';

export default function HomeScreen() {
  const { subscriptions, loading, monthlyTotal, budget } = useSubscriptions();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBarSpace();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [budgetOpen, setBudgetOpen] = useState(false);

  const firstName = (user?.displayName ?? '').split(' ')[0];
  const open = (sub: Subscription) => router.push(`/subscription/${sub.id}`);

  // Próximos 6 meses de cobros reales (mensuales + anuales que caen en cada mes)
  const trend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { label: MONTHS_SHORT[d.getMonth()], value: totalForMonth(subscriptions, d.getFullYear(), d.getMonth()) };
    });
  }, [subscriptions]);

  const [featured, ...rest] = subscriptions;
  const upcoming = useMemo(
    () => rest.filter(s => daysUntilRenewal(s) <= 14),
    [rest],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions.filter(s =>
      (filter === 'all' || s.billing_cycle === filter) &&
      (!q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)),
    );
  }, [subscriptions, filter, query]);

  const pct = budget > 0 ? monthlyTotal / budget : 0;
  const overBudget = pct > 1;
  const { int, dec } = moneyParts(monthlyTotal);
  const urgentCount = subscriptions.filter(s => daysUntilRenewal(s) <= 3).length;
  const searching = query.trim().length > 0;

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <BudgetModal visible={budgetOpen} onClose={() => setBudgetOpen(false)} />

      {/* ── Header ── */}
      <View style={s.header}>
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}>
          <Ionicons name="repeat" size={18} color="#fff" />
        </LinearGradient>
        <Text style={[s.brand, { color: colors.text }]}>SUBLY</Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="notifications-outline"
          badge={urgentCount > 0}
          onPress={() => router.push('/calendar')}
          accessibilityLabel={urgentCount > 0 ? `${urgentCount} cobros próximos` : 'Calendario de cobros'}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom }} keyboardShouldPersistTaps="handled">
        <Text style={[s.hello, { color: colors.subtext }]}>{greeting()}{firstName ? `, ${firstName}` : ''} 👋</Text>

        <SearchField
          placeholder="Buscar suscripción…"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />

        {!searching && (
          <>
            {/* ── Hero: gasto mensual + tendencia ── */}
            <View style={[s.hero, { backgroundColor: colors.surfaceAlt }]}>
              <View style={s.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.heroLabel, { color: colors.subtext }]}>Gasto mensual</Text>
                  <View style={s.heroAmountRow}>
                    <Text style={[s.heroAmount, { color: colors.text }]}>
                      {int}<Text style={s.heroDec}>.{dec}</Text>
                    </Text>
                    <View style={[s.pctChip, { backgroundColor: overBudget ? colors.urgentSoft : colors.accentSoft }]}>
                      <Ionicons name={overBudget ? 'warning' : 'pie-chart'} size={11} color={overBudget ? colors.urgent : colors.accent} />
                      <Text style={[s.pctText, { color: overBudget ? colors.urgent : colors.accent }]}>{Math.round(pct * 100)}%</Text>
                    </View>
                  </View>
                </View>
                <Pressable onPress={() => setBudgetOpen(true)} style={[s.budgetPill, { backgroundColor: colors.bg }]} hitSlop={6}>
                  <Text style={[s.budgetText, { color: colors.text }]}>de {moneyShort(budget)}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.text} />
                </Pressable>
              </View>

              <View style={[s.track, { backgroundColor: colors.bg }]}>
                <LinearGradient
                  colors={overBudget ? [colors.urgent, colors.urgent] : colors.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.trackFill, { width: `${Math.min(pct, 1) * 100}%` }]}
                />
              </View>

              <AreaChart
                id="home"
                data={trend.map(t => t.value)}
                labels={trend.map(t => t.label)}
                highlightIndex={0}
                height={110}
              />
              <Text style={[s.heroFoot, { color: colors.subtext }]}>
                Cobros reales próximos 6 meses · {pluralize(subscriptions.length, 'activa', 'activas')}
              </Text>
            </View>

            {/* ── Próximo cobro destacado ── */}
            {featured && (
              <>
                <SectionHeader title="Próximo cobro" action="Calendario" onAction={() => router.push('/calendar')} />
                <FeaturedSubscriptionCard sub={featured} onPress={() => open(featured)} />
              </>
            )}

            {/* ── Carrusel próximos 14 días ── */}
            {upcoming.length > 0 && (
              <>
                <SectionHeader title="Próximos 14 días" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carousel}>
                  {upcoming.map(sub => <UpcomingTile key={sub.id} sub={sub} onPress={() => open(sub)} />)}
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* ── Lista con filtros ── */}
        {subscriptions.length > 0 && (
          <>
            <SectionHeader title={searching ? 'Resultados' : 'Mis suscripciones'} action="Estadísticas" onAction={() => router.push('/explore')} />
            <FilterPills<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { key: 'all', label: 'Todas' },
                { key: 'monthly', label: 'Mensuales' },
                { key: 'yearly', label: 'Anuales' },
              ]}
            />
            <View style={{ marginTop: 10 }}>
              {filtered.map(sub => <SubscriptionRow key={sub.id} sub={sub} onPress={() => open(sub)} />)}
              {filtered.length === 0 && (
                <Text style={[s.noResults, { color: colors.subtext }]}>Nada coincide con tu búsqueda.</Text>
              )}
            </View>
          </>
        )}

        {/* ── Descubrir catálogo ── */}
        {!searching && subscriptions.length > 0 && (
          <PressableScale onPress={() => router.push('/catalog')} style={s.discoverWrap}>
            <LinearGradient colors={colors.gradientAlt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.discover}>
              <View style={{ flex: 1 }}>
                <Text style={s.discoverTitle}>Explora el catálogo</Text>
                <Text style={s.discoverBody}>Netflix, Spotify, ChatGPT, Game Pass… con precios en MXN.</Text>
              </View>
              <View style={s.discoverIcon}>
                <Ionicons name="compass" size={26} color="#fff" />
              </View>
            </LinearGradient>
          </PressableScale>
        )}

        {!loading && subscriptions.length === 0 && (
          <EmptyState
            icon="receipt-outline"
            title="Sin suscripciones aún"
            body="Agrega tus servicios para ver cuánto gastas, cuándo te cobran y dónde puedes ahorrar."
            cta="Agregar la primera"
            onCta={() => router.push('/subscription/new')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screen, paddingTop: 6, paddingBottom: 6 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  hello: { ...type.bodyBold, paddingHorizontal: spacing.screen, marginTop: 6, marginBottom: 14 },

  hero: { marginHorizontal: spacing.screen, marginTop: 18, borderRadius: radius.lg, padding: 18, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroLabel: { fontSize: 14, fontWeight: '700' },
  heroAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  heroAmount: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  heroDec: { fontSize: 20, fontWeight: '800' },
  pctChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.xs },
  pctText: { fontSize: 12, fontWeight: '900' },
  budgetPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  budgetText: { fontSize: 13, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 14, marginBottom: 12 },
  trackFill: { height: 8, borderRadius: 4 },
  heroFoot: { fontSize: 11, fontWeight: '700', marginTop: 10, textAlign: 'center' },

  carousel: { paddingHorizontal: spacing.screen, gap: 12 },
  noResults: { ...type.body, textAlign: 'center', paddingVertical: 24 },

  discoverWrap: { marginHorizontal: spacing.screen, marginTop: 26 },
  discover: { borderRadius: radius.lg, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  discoverTitle: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  discoverBody: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  discoverIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
