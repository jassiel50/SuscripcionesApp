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
  EmptyState, FeaturedSubscriptionCard, FilterPills, IconButton,
  PressableScale, SearchField, SectionHeader, SubscriptionRow, UpcomingTile, useTabBarSpace,
} from '../../src/components/ui';
import { daysUntilRenewal, greeting, totalForMonth } from '../../src/utils/dates';
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

  // Cobros reales: próximos 7 días y mes calendario en curso
  const { next7, thisMonth } = useMemo(() => {
    const now = new Date();
    return {
      next7: subscriptions.filter(sb => daysUntilRenewal(sb) <= 7).reduce((t, sb) => t + sb.price, 0),
      thisMonth: totalForMonth(subscriptions, now.getFullYear(), now.getMonth()),
    };
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
        <View style={[s.logo, { backgroundColor: colors.ink }]}>
          <Ionicons name="repeat" size={18} color={colors.onInk} />
        </View>
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
            {/* ── Hero: tarjeta negra con gasto mensual y presupuesto ── */}
            <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.heroLabel, { color: colors.onInk }]}>Gasto mensual</Text>
                  <Text style={[s.heroAmount, { color: colors.onInk }]}>
                    {int}<Text style={s.heroDec}>.{dec}</Text>
                  </Text>
                </View>
                <Pressable onPress={() => setBudgetOpen(true)} style={[s.budgetPill, { borderColor: colors.onInk }]} hitSlop={6} accessibilityLabel="Editar presupuesto">
                  <Text style={[s.budgetText, { color: colors.onInk }]}>de {moneyShort(budget)}</Text>
                  <Ionicons name="pencil" size={12} color={colors.onInk} />
                </Pressable>
              </View>

              <View style={[s.track, { backgroundColor: colors.onInk + '33' }]}>
                <View style={[s.trackFill, { width: `${Math.min(pct, 1) * 100}%`, backgroundColor: overBudget ? colors.urgent : colors.onInk }]} />
              </View>
              <View style={s.heroMeta}>
                <Text style={[s.heroMetaText, { color: overBudget ? colors.urgent : colors.onInk }]}>
                  {overBudget ? `Excedido por ${moneyShort(monthlyTotal - budget)}` : `${Math.round(pct * 100)}% del presupuesto`}
                </Text>
                <Text style={[s.heroMetaText, { color: colors.onInk }]}>{pluralize(subscriptions.length, 'activa', 'activas')}</Text>
              </View>
            </LinearGradient>

            {/* ── Resumen rápido (sin gráfica: tres cifras dicen más aquí) ── */}
            <View style={s.summary}>
              {[
                { label: 'Esta semana', value: moneyShort(next7) },
                { label: 'Este mes', value: moneyShort(thisMonth) },
                { label: 'Al año', value: moneyShort(monthlyTotal * 12) },
              ].map(item => (
                <View key={item.label} style={[s.summaryItem, { backgroundColor: colors.surface }]}>
                  <Text style={[s.summaryValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                  <Text style={[s.summaryLabel, { color: colors.subtext }]}>{item.label}</Text>
                </View>
              ))}
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
            <View style={[s.discover, { backgroundColor: colors.surface }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.discoverTitle, { color: colors.text }]}>Explora el catálogo</Text>
                <Text style={[s.discoverBody, { color: colors.subtext }]}>Netflix, Spotify, ChatGPT, Game Pass… con precios en MXN.</Text>
              </View>
              <View style={[s.discoverIcon, { backgroundColor: colors.ink }]}>
                <Ionicons name="arrow-forward" size={22} color={colors.onInk} />
              </View>
            </View>
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
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  hello: { ...type.bodyBold, paddingHorizontal: spacing.screen, marginTop: 6, marginBottom: 14 },

  hero: { marginHorizontal: spacing.screen, marginTop: 18, borderRadius: radius.xl, padding: 22 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroLabel: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  heroAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1.4, marginTop: 4 },
  heroDec: { fontSize: 20, fontWeight: '800' },
  budgetPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1 },
  budgetText: { fontSize: 13, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 22 },
  trackFill: { height: 6, borderRadius: 3 },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  heroMetaText: { fontSize: 12, fontWeight: '800', opacity: 0.85 },

  summary: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 12 },
  summaryItem: { flex: 1, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 12, gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 12, fontWeight: '700' },

  carousel: { paddingHorizontal: spacing.screen, gap: 12 },
  noResults: { ...type.body, textAlign: 'center', paddingVertical: 24 },

  discoverWrap: { marginHorizontal: spacing.screen, marginTop: 26 },
  discover: { borderRadius: radius.lg, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  discoverTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  discoverBody: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  discoverIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
