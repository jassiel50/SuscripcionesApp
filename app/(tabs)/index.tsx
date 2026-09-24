import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedStyle,
} from 'react-native-reanimated';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import BudgetModal from '../../src/components/BudgetModal';
import {
  AnimatedNumber, EmptyState, FeaturedSubscriptionCard, FilterPills, Glass, IconButton, PressableScale,
  ProgressBar, ScreenBackground, SearchField, SectionHeader, Skeleton, SubscriptionRow, TOP_BAR_H, TopBar,
  UpcomingTile, useScreenScroll, useTabBarSpace, type IoniconName,
} from '../../src/components/ui';
import { daysUntilRenewal, greeting, totalForMonth } from '../../src/utils/dates';
import { money, moneyShort } from '../../src/utils/format';
import { enter, listLayout } from '../../src/theme/motion';
import { radius, spacing, type } from '../../src/theme/tokens';
import type { Subscription } from '../../src/types';

type Filter = 'all' | 'monthly' | 'yearly';

export default function HomeScreen() {
  const { subscriptions, loading, monthlyTotal, budget } = useSubscriptions();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { scrollY, onScroll } = useScreenScroll();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [budgetOpen, setBudgetOpen] = useState(false);

  const name = user?.displayName ?? user?.email?.split('@')[0] ?? '';
  const firstName = name.split(' ')[0];
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'S';
  const open = (sub: Subscription) => router.push(`/subscription/${sub.id}`);

  const { next7, thisMonth } = useMemo(() => {
    const now = new Date();
    return {
      next7: subscriptions.filter(sb => daysUntilRenewal(sb) <= 7).reduce((t, sb) => t + sb.price, 0),
      thisMonth: totalForMonth(subscriptions, now.getFullYear(), now.getMonth()),
    };
  }, [subscriptions]);

  const featured = subscriptions[0];
  const upcoming = useMemo(() => subscriptions.slice(1).filter(s => daysUntilRenewal(s) <= 14), [subscriptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions.filter(s =>
      (filter === 'all' || s.billing_cycle === filter) &&
      (!q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)),
    );
  }, [subscriptions, filter, query]);

  const pct = budget > 0 ? monthlyTotal / budget : 0;
  const over = pct > 1;
  const level = over ? colors.chartBad : pct > 0.8 ? colors.chartWarn : colors.chartGood;
  const urgentCount = subscriptions.filter(s => daysUntilRenewal(s) <= 3).length;
  const searching = query.trim().length > 0;

  // Parallax del saldo: se desvanece y encoge al hacer scroll (como Revolut)
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 170], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, 200], [-30, 0, 70], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-100, 0, 200], [1.08, 1, 0.9], Extrapolation.CLAMP) },
    ],
  }));

  const actions: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'add', label: 'Agregar', onPress: () => router.push('/subscription/new') },
    { icon: 'calendar-outline', label: 'Calendario', onPress: () => router.push('/calendar') },
    { icon: 'wallet-outline', label: 'Presupuesto', onPress: () => setBudgetOpen(true) },
    { icon: 'compass-outline', label: 'Explorar', onPress: () => router.push('/catalog') },
  ];

  return (
    <View style={s.root}>
      <ScreenBackground scene="home" />
      <BudgetModal visible={budgetOpen} onClose={() => setBudgetOpen(false)} />

      <TopBar
        scrollY={scrollY}
        left={
          <PressableScale onPress={() => router.push('/profile')} scaleTo={0.88} accessibilityLabel="Perfil">
            <Glass radius={22} interactive>
              <View style={s.avatar}><Text style={[s.avatarText, { color: colors.text }]}>{initials}</Text></View>
            </Glass>
          </PressableScale>
        }
        right={
          <IconButton
            icon="notifications-outline"
            badge={urgentCount > 0}
            onPress={() => router.push('/calendar')}
            accessibilityLabel={urgentCount > 0 ? `${urgentCount} cobros próximos` : 'Calendario de cobros'}
          />
        }
      >
        <SearchField compact placeholder="Buscar" value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      </TopBar>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + TOP_BAR_H + 6, paddingBottom: bottom }}
      >
        {!searching && (
          <>
            {/* ── Saldo centrado sobre el degradado ── */}
            <Animated.View style={[s.hero, heroStyle]}>
              <Text style={[s.heroLabel, { color: colors.subtext }]}>{greeting()}{firstName ? `, ${firstName}` : ''} · Gasto mensual</Text>
              {loading
                ? <Skeleton width={200} height={52} radius={14} style={{ marginVertical: 6 }} />
                : <AnimatedNumber value={monthlyTotal} format={money} style={[s.heroAmount, { color: colors.text }]} />}
              <PressableScale onPress={() => setBudgetOpen(true)} scaleTo={0.94} accessibilityLabel="Editar presupuesto">
                <Glass radius={999}>
                  <View style={s.budgetChip}>
                    <Text style={[s.budgetText, { color: over ? colors.urgent : colors.text }]}>
                      {Math.round(pct * 100)}% de {moneyShort(budget)}
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={colors.subtext} />
                  </View>
                </Glass>
              </PressableScale>
              <ProgressBar value={pct} colors={level} height={6} delay={400} style={s.heroBar} />
            </Animated.View>

            {/* ── Acciones rápidas (botones redondos de vidrio) ── */}
            <Animated.View entering={enter(0)} style={s.actions}>
              {actions.map(a => (
                <PressableScale key={a.label} onPress={a.onPress} scaleTo={0.9} style={s.action} accessibilityLabel={a.label}>
                  <Glass radius={26} interactive>
                    <View style={s.actionIcon}><Ionicons name={a.icon} size={22} color={colors.text} /></View>
                  </Glass>
                  <Text style={[s.actionLabel, { color: colors.text }]}>{a.label}</Text>
                </PressableScale>
              ))}
            </Animated.View>

            {/* ── Resumen: 3 cifras ── */}
            <Animated.View entering={enter(1)} style={s.summary}>
              {[
                { label: 'Esta semana', value: next7 },
                { label: 'Este mes', value: thisMonth },
                { label: 'Al año', value: monthlyTotal * 12 },
              ].map(item => (
                <View key={item.label} style={[s.summaryItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <AnimatedNumber value={item.value} format={moneyShort} style={[s.summaryValue, { color: colors.text }]} />
                  <Text style={[s.summaryLabel, { color: colors.subtext }]}>{item.label}</Text>
                </View>
              ))}
            </Animated.View>

            {featured && (
              <Animated.View entering={enter(2)}>
                <SectionHeader title="Próximo cobro" action="Calendario" onAction={() => router.push('/calendar')} />
                <FeaturedSubscriptionCard sub={featured} onPress={() => open(featured)} />
              </Animated.View>
            )}

            {upcoming.length > 0 && (
              <Animated.View entering={enter(3)}>
                <SectionHeader title="Próximos 14 días" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carousel} decelerationRate="fast" snapToInterval={180}>
                  {upcoming.map(sub => <UpcomingTile key={sub.id} sub={sub} onPress={() => open(sub)} />)}
                </ScrollView>
              </Animated.View>
            )}
          </>
        )}

        {/* ── Lista con filtros (se reacomoda con animación) ── */}
        {subscriptions.length > 0 && (
          <Animated.View entering={enter(4)}>
            <SectionHeader title={searching ? 'Resultados' : 'Mis suscripciones'} action={searching ? undefined : 'Estadísticas'} onAction={() => router.push('/explore')} />
            <FilterPills<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { key: 'all', label: 'Todas' },
                { key: 'monthly', label: 'Mensuales' },
                { key: 'yearly', label: 'Anuales' },
              ]}
            />
            <Animated.View layout={listLayout} style={[s.listCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              {filtered.map(sub => (
                <Animated.View key={sub.id} layout={listLayout} entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)}>
                  <SubscriptionRow sub={sub} inset={14} onPress={() => open(sub)} />
                </Animated.View>
              ))}
              {filtered.length === 0 && (
                <Text style={[s.noResults, { color: colors.subtext }]}>Nada coincide con tu búsqueda.</Text>
              )}
            </Animated.View>
          </Animated.View>
        )}

        {loading && (
          <View style={{ paddingHorizontal: spacing.screen, gap: 12, marginTop: 20 }}>
            {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height={64} radius={18} />)}
          </View>
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
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },

  hero: { alignItems: 'center', paddingTop: 34, paddingBottom: 8, paddingHorizontal: spacing.screen, gap: 10 },
  heroLabel: { fontSize: 14, fontWeight: '600' },
  heroAmount: { ...type.display, fontSize: 48, letterSpacing: -1.6 },
  budgetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  budgetText: { fontSize: 13, fontWeight: '700' },
  heroBar: { width: '62%', marginTop: 4 },

  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.screen - 4, marginTop: 26 },
  action: { alignItems: 'center', gap: 8, width: 78 },
  actionIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600' },

  summary: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 24 },
  summaryItem: { flex: 1, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 12, gap: 2, borderWidth: StyleSheet.hairlineWidth },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 12, fontWeight: '600' },

  carousel: { paddingHorizontal: spacing.screen, gap: 12 },
  listCard: { marginHorizontal: spacing.screen, marginTop: 14, borderRadius: radius.lg, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  noResults: { ...type.body, textAlign: 'center', paddingVertical: 24 },
});
