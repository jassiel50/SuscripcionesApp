import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isExpoGo } from '../../src/utils/env';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type Subscription } from '../../src/types';
import { SubIcon } from '../../src/utils/brandIcons';

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntilRenewal(dateStr: string): number {
  return Math.ceil((new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / 86400000);
}

function renewalBadgeLabel(dateStr: string): string {
  const days = daysUntilRenewal(dateStr);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── Add button ─────────────────────────────────────────────────────────────────

function AddButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (useGlass) {
    return (
      <GlassContainer style={s.addGlassOuter}>
        <GlassView glassEffectStyle="regular" style={s.addGlassInner}>
          <TouchableOpacity onPress={onPress} style={s.addBtnTouch} activeOpacity={0.7}>
            <Ionicons name="add" size={26} color={colors.accent} />
          </TouchableOpacity>
        </GlassView>
      </GlassContainer>
    );
  }

  return (
    <TouchableOpacity
      style={[s.addBtnFallback, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={22} color={colors.primaryText} />
      <Text style={[s.addBtnLabel, { color: colors.primaryText }]}>Nueva</Text>
    </TouchableOpacity>
  );
}

// ── Budget modal ───────────────────────────────────────────────────────────────

const BUDGET_KEY = '@subs_budget';
const DEFAULT_BUDGET = 500;

function BudgetModal({ visible, current, colors, onSave, onClose }: {
  visible: boolean;
  current: number;
  colors: ReturnType<typeof useTheme>['colors'];
  onSave: (value: number) => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setRaw(current.toFixed(2));
  }, [visible, current]);

  const handleSave = () => {
    const value = parseFloat(raw.replace(',', '.'));
    if (!isNaN(value) && value > 0) onSave(value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={bm.overlay}
      >
        <TouchableOpacity style={bm.scrim} activeOpacity={1} onPress={onClose} />
        <View style={[bm.dialog, { backgroundColor: colors.card }]}>
          <Text style={[bm.title, { color: colors.text }]}>Presupuesto mensual</Text>
          <Text style={[bm.subtitle, { color: colors.subtext }]}>
            ¿Cuánto quieres gastar al mes en suscripciones?
          </Text>
          <View style={[bm.inputWrap, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[bm.currency, { color: colors.subtext }]}>$</Text>
            <TextInput
              ref={inputRef}
              style={[bm.input, { color: colors.text }]}
              value={raw}
              onChangeText={setRaw}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
          <View style={bm.btns}>
            <TouchableOpacity style={[bm.btn, { backgroundColor: colors.separator }]} onPress={onClose}>
              <Text style={[bm.btnText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[bm.btn, { backgroundColor: colors.accent }]} onPress={handleSave}>
              <Text style={[bm.btnText, { color: '#fff' }]}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const bm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  dialog: { width: '82%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20, gap: 6 },
  currency: { fontSize: 22, fontWeight: '600' },
  input: { flex: 1, fontSize: 30, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});

// ── Upcoming card ──────────────────────────────────────────────────────────────

function UpcomingCard({ sub, idx, onPress }: { sub: Subscription; idx: number; onPress: () => void }) {
  const { colors } = useTheme();
  const days = daysUntilRenewal(sub.next_renewal);
  const label = renewalBadgeLabel(sub.next_renewal);
  const isUrgent = days <= 3;
  const accent = isUrgent ? '#EF4444' : sub.color;

  return (
    <TouchableOpacity
      style={[s.upCard, {
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
        borderLeftColor: accent,
      }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <SubIcon name={sub.name} color={sub.color} size={44} borderRadius={13} />
      <Text style={[s.upName, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
      <Text style={[s.upPrice, { color: colors.subtext }]}>${sub.price.toFixed(2)}</Text>
      <View style={[s.upBadge, { backgroundColor: accent + '20' }]}>
        <Text style={[s.upBadgeText, { color: isUrgent ? colors.urgent : accent }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { subscriptions, loading, monthlyTotal } = useSubscriptions();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BUDGET_KEY).then(val => {
      if (val) setBudget(parseFloat(val));
    });
  }, []);

  const saveBudget = async (value: number) => {
    setBudget(value);
    await AsyncStorage.setItem(BUDGET_KEY, String(value));
  };

  const upcoming: Subscription[] = useMemo(() =>
    subscriptions.filter(s => {
      const d = daysUntilRenewal(s.next_renewal);
      return d >= 0 && d <= 14;
    }), [subscriptions]);

  const pct = Math.min((monthlyTotal / budget) * 100, 100);
  const isOverBudget = pct >= 85;

  const navigateTo = (sub: Subscription) => router.push(`/subscription/${sub.id}`);

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <BudgetModal
        visible={budgetModalVisible}
        current={budget}
        colors={colors}
        onSave={saveBudget}
        onClose={() => setBudgetModalVisible(false)}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={[s.dateLabel, { color: colors.subtext }]}>
            {getDateLabel()}
          </Text>
          <Text style={[s.greeting, { color: colors.text }]}>
            {getGreeting()} 👋
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={[s.notifBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.subtext} />
          </TouchableOpacity>
          <AddButton onPress={() => router.push('/subscription/new')} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isExpoGo ? insets.bottom + 90 : 28 }}
      >
        {/* ── Spending hero card ── */}
        <LinearGradient
          colors={dark ? ['#1E293B', '#111827'] : ['#111827', '#374151']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroDec1} />
          <View style={s.heroDec2} />

          <View style={s.heroTop}>
            <Text style={s.heroLabel}>Gasto mensual</Text>
            <TouchableOpacity
              style={s.heroBudgetBtn}
              onPress={() => setBudgetModalVisible(true)}
            >
              <Text style={s.heroBudgetText}>de ${budget.toFixed(0)}</Text>
              <Ionicons name="pencil-outline" size={10} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <Text style={s.heroAmount}>${monthlyTotal.toFixed(2)}</Text>
          <Text style={s.heroSub}>{pct.toFixed(0)}% del presupuesto · {subscriptions.length} activas</Text>

          <View style={s.heroProgress}>
            <View style={[s.heroProgressFill, {
              width: `${pct}%` as any,
              backgroundColor: isOverBudget ? '#FCA5A5' : '#fff',
            }]} />
          </View>

          {/* Quick actions */}
          <View style={s.quickActions}>
            {[
              { icon: 'add-circle-outline' as const,  label: 'Agregar',  action: () => router.push('/subscription/new') },
              { icon: 'list-outline' as const,        label: 'Ver todo', action: () => {} },
              { icon: 'bar-chart-outline' as const,   label: 'Estadísticas', action: () => {} },
              { icon: 'settings-outline' as const,    label: 'Presupuesto', action: () => setBudgetModalVisible(true) },
            ].map(q => (
              <TouchableOpacity key={q.label} style={s.quickBtn} onPress={q.action}>
                <View style={s.quickIcon}>
                  <Ionicons name={q.icon} size={20} color="#fff" />
                </View>
                <Text style={s.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* ── Próximos pagos ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Próximos pagos</Text>
          <TouchableOpacity style={s.seeAllBtn}>
            <Text style={[s.seeAll, { color: colors.accent }]}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={[s.infoText, { color: colors.subtext }]}>Cargando…</Text>
        ) : upcoming.length === 0 ? (
          <View style={[s.allClearCard, { backgroundColor: dark ? '#052E16' : '#F0FDF4' }]}>
            <View style={[s.allClearIcon, { backgroundColor: dark ? '#14532D' : '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
            </View>
            <View>
              <Text style={[s.allClearTitle, { color: dark ? '#86EFAC' : '#14532D' }]}>¡Todo al corriente!</Text>
              <Text style={[s.allClearSub, { color: dark ? '#4ADE80' : '#166534' }]}>Sin pagos en los próximos 14 días</Text>
            </View>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.upcomingRow}
          >
            {upcoming.map((sub, i) => (
              <UpcomingCard key={sub.id} sub={sub} idx={i} onPress={() => navigateTo(sub)} />
            ))}
          </ScrollView>
        )}

        {/* ── Resumen stats ── */}
        {subscriptions.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Resumen del mes</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
              {[
                { label: 'Gasto total', value: `$${monthlyTotal.toFixed(2)}`, icon: 'wallet-outline' as const, color: dark ? '#60A5FA' : '#2563EB', bg: dark ? '#1E3A5F' : '#EFF6FF' },
                { label: 'Disponible', value: `$${Math.max(0, budget - monthlyTotal).toFixed(0)}`, icon: 'trending-up-outline' as const, color: dark ? '#4ADE80' : '#16A34A', bg: dark ? '#052E16' : '#F0FDF4' },
                { label: 'Anual est.', value: `$${(monthlyTotal * 12).toFixed(0)}`, icon: 'calendar-outline' as const, color: dark ? '#94A3B8' : '#475569', bg: dark ? '#1E293B' : '#F1F5F9' },
                { label: 'Activas', value: `${subscriptions.length}`, icon: 'apps-outline' as const, color: dark ? '#CBD5E1' : '#374151', bg: dark ? '#0F172A' : '#F3F4F6' },
              ].map(stat => (
                <View key={stat.label} style={[s.statCard, { backgroundColor: stat.bg }]}>
                  <View style={[s.statIcon, { backgroundColor: stat.color + '22' }]}>
                    <Ionicons name={stat.icon} size={18} color={stat.color} />
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[s.statLabel, { color: stat.color, opacity: 0.7 }]}>{stat.label}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Todas las suscripciones ── */}
        {subscriptions.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Todas las suscripciones</Text>
            </View>
            <View style={s.subCardCol}>
              {subscriptions.map(item => {
                const d = daysUntilRenewal(item.next_renewal);
                const urg = d <= 0 ? 'Hoy' : d === 1 ? 'Mañana' : d < 7 ? `En ${d} días`
                  : new Date(item.next_renewal + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                const isUrgent = d <= 3;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.subCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => navigateTo(item)}
                    activeOpacity={0.75}
                  >
                    <SubIcon name={item.name} color={item.color} size={46} borderRadius={14} />
                    <View style={s.subCardInfo}>
                      <Text style={[s.subCardName, { color: colors.text }]}>{item.name}</Text>
                      <View style={s.subCardPills}>
                        <View style={[s.subCardPill, {
                          backgroundColor: item.billing_cycle === 'monthly'
                            ? (dark ? '#052E16' : '#F0FDF4')
                            : (dark ? '#1E3A5F' : '#EFF6FF'),
                        }]}>
                          <Text style={[s.subCardPillText, {
                            color: item.billing_cycle === 'monthly'
                              ? (dark ? '#4ADE80' : '#16A34A')
                              : (dark ? '#93C5FD' : '#2563EB'),
                          }]}>
                            {item.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                          </Text>
                        </View>
                        {isUrgent && (
                          <View style={[s.subCardPill, { backgroundColor: dark ? '#4C0519' : '#FEF2F2' }]}>
                            <Text style={[s.subCardPillText, { color: colors.urgent }]}>{urg}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={s.subCardRight}>
                      <Text style={[s.subCardPrice, { color: colors.text }]}>${item.price.toFixed(2)}</Text>
                      <Text style={[s.subCardCycle, { color: colors.subtext }]}>{!isUrgent ? urg : (item.billing_cycle === 'monthly' ? '/mes' : '/año')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={colors.subtext} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && subscriptions.length === 0 && (
          <View style={s.emptyContainer}>
            <LinearGradient colors={dark ? ['#1E3A5F', '#1E40AF'] : ['#EFF6FF', '#DBEAFE']} style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={44} color="#2563EB" />
            </LinearGradient>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Sin suscripciones</Text>
            <Text style={[s.emptyDesc, { color: colors.subtext }]}>
              Agrega tus servicios para llevar un control de tus gastos mensuales.
            </Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/subscription/new')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.emptyBtnText}>Agregar primera suscripción</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  dateLabel: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize', marginBottom: 2 },
  greeting: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  addGlassOuter: { borderRadius: 24, width: 44, height: 44 },
  addGlassInner: { borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnTouch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnFallback: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6 },
  addBtnLabel: { fontSize: 14, fontWeight: '700' },

  // Hero card
  heroCard: { marginHorizontal: 16, borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroDec1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60 },
  heroDec2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  heroBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroBudgetText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  heroAmount: { color: '#fff', fontSize: 46, fontWeight: '800', letterSpacing: -2, marginBottom: 3 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 14 },
  heroProgress: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 20 },
  heroProgressFill: { height: 4, borderRadius: 2 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { alignItems: 'center', gap: 6, flex: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Section rows
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 14, fontWeight: '600' },

  infoText: { fontSize: 15, marginHorizontal: 20 },

  // All-clear
  allClearCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 18, padding: 16, gap: 14 },
  allClearIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  allClearTitle: { fontSize: 15, fontWeight: '700' },
  allClearSub: { fontSize: 13, marginTop: 2 },

  // Upcoming
  upcomingRow: { paddingHorizontal: 16, gap: 10 },
  upCard: {
    width: 148, borderRadius: 18, padding: 14, gap: 8,
    borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  upName: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  upPrice: { fontSize: 13, fontWeight: '500' },
  upBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  upBadgeText: { fontSize: 11, fontWeight: '700' },

  // Stats
  statsRow: { paddingHorizontal: 16, gap: 10 },
  statCard: { width: 120, borderRadius: 18, padding: 14, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600' },

  // Individual subscription cards
  subCardCol: { marginHorizontal: 16, gap: 10 },
  subCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  subCardInfo: { flex: 1 },
  subCardName: { fontSize: 15, fontWeight: '700' },
  subCardPills: { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  subCardPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  subCardPillText: { fontSize: 11, fontWeight: '600' },
  subCardRight: { alignItems: 'flex-end' },
  subCardPrice: { fontSize: 16, fontWeight: '800' },
  subCardCycle: { fontSize: 11, marginTop: 2 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 32, gap: 14 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, marginTop: 6 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
