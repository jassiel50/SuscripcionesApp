import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isExpoGo } from '../../src/utils/env';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { SubIcon } from '../../src/utils/brandIcons';
import { PAYMENT_METHOD_LABELS } from '../../src/types';
import type { Subscription } from '../../src/types';

const DAYS_SHORT  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function subsOnDate(subs: Subscription[], yr: number, mo: number, dy: number): Subscription[] {
  return subs.filter(sub => {
    const r = new Date(sub.next_renewal + 'T12:00:00');
    if (sub.billing_cycle === 'monthly') {
      const after = yr > r.getFullYear() || (yr === r.getFullYear() && mo >= r.getMonth());
      return after && r.getDate() === dy;
    }
    return yr >= r.getFullYear() && r.getMonth() === mo && r.getDate() === dy;
  });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / 86400000);
}

function getWeekDays(center: Date): Date[] {
  const dow = center.getDay();
  const mon = new Date(center);
  mon.setDate(center.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

// ── Month grid component ────────────────────────────────────────────────────────

function MonthGrid({
  displayYear, displayMonth, selected, todayStr: today,
  subscriptions, colors, dark, onSelect,
}: {
  displayYear: number; displayMonth: number;
  selected: string; todayStr: string;
  subscriptions: Subscription[];
  colors: ReturnType<typeof useTheme>['colors'];
  dark: boolean;
  onSelect: (ds: string) => void;
}) {
  const firstDow  = new Date(displayYear, displayMonth, 1).getDay();
  const firstMon  = (firstDow + 6) % 7;
  const daysInMo  = new Date(displayYear, displayMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstMon).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={mg.grid}>
      <View style={mg.headerRow}>
        {DAY_LETTERS.map(d => (
          <Text key={d} style={[mg.headerCell, { color: colors.subtext }]}>{d}</Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={mg.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={`e${col}`} style={mg.cell} />;
            const ds       = toDateStr(new Date(displayYear, displayMonth, day));
            const isSel    = ds === selected;
            const isToday  = ds === today;
            const daySubs  = subsOnDate(subscriptions, displayYear, displayMonth, day);
            const isUrgent = daySubs.some(s => daysUntil(s.next_renewal) <= 3);
            return (
              <TouchableOpacity key={col} style={mg.cell} onPress={() => onSelect(ds)} activeOpacity={0.7}>
                <View style={[
                  mg.dayCircle,
                  isSel   && { backgroundColor: dark ? '#F1F5F9' : '#111827' },
                  isToday && !isSel && { borderWidth: 1.5, borderColor: dark ? '#F1F5F9' : '#111827' },
                ]}>
                  <Text style={[
                    mg.dayNum,
                    { color: isSel
                      ? (dark ? '#111827' : '#fff')
                      : isToday ? (dark ? '#F1F5F9' : '#111827')
                      : colors.text,
                    },
                    isSel && { fontWeight: '800' },
                  ]}>
                    {day}
                  </Text>
                </View>
                {daySubs.length > 0 && (
                  <View style={[mg.dot, {
                    backgroundColor: isSel
                      ? (dark ? '#111827' : '#fff')
                      : isUrgent ? '#EF4444' : daySubs[0].color,
                  }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const mg = StyleSheet.create({
  grid:       { paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4 },
  headerRow:  { flexDirection: 'row', marginBottom: 2 },
  headerCell: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 6 },
  row:        { flexDirection: 'row' },
  cell:       { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  dayCircle:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNum:     { fontSize: 14, fontWeight: '500' },
  dot:        { width: 5, height: 5, borderRadius: 3 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { subscriptions } = useSubscriptions();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const today    = new Date();
  const todayStr = toDateStr(today);

  const [selected,  setSelected]  = useState(todayStr);
  const [viewMode,  setViewMode]  = useState<'week' | 'month'>('week');
  const [dispYear,  setDispYear]  = useState(today.getFullYear());
  const [dispMonth, setDispMonth] = useState(today.getMonth());

  const selectedDt = useMemo(() => new Date(selected + 'T12:00:00'), [selected]);
  const weekDays   = useMemo(() => getWeekDays(selectedDt), [selectedDt]);
  const selYear    = selectedDt.getFullYear();
  const selMonth   = selectedDt.getMonth();

  // Hero shows the "current" month depending on view mode
  const heroYear  = viewMode === 'week' ? selYear  : dispYear;
  const heroMonth = viewMode === 'week' ? selMonth : dispMonth;

  const monthTotal = useMemo(() => {
    const last = new Date(heroYear, heroMonth + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= last; d++)
      for (const sub of subsOnDate(subscriptions, heroYear, heroMonth, d)) total += sub.price;
    return total;
  }, [subscriptions, heroYear, heroMonth]);

  const selectedSubs = useMemo(() =>
    subsOnDate(subscriptions, selYear, selMonth, selectedDt.getDate()),
    [subscriptions, selected]);

  const otherSubs = useMemo(() => {
    if (viewMode === 'month') return []; // month grid already shows everything
    const last = new Date(selYear, selMonth + 1, 0).getDate();
    const seen = new Set<string>();
    const result: { sub: Subscription; dateStr: string }[] = [];
    for (let d = 1; d <= last; d++) {
      const ds = toDateStr(new Date(selYear, selMonth, d));
      if (ds === selected) continue;
      for (const sub of subsOnDate(subscriptions, selYear, selMonth, d)) {
        if (!seen.has(sub.id + ds) && daysUntil(ds) >= 0) {
          seen.add(sub.id + ds);
          result.push({ sub, dateStr: ds });
        }
      }
    }
    return result;
  }, [subscriptions, selYear, selMonth, selected, viewMode]);

  const shiftPeriod = (dir: -1 | 1) => {
    if (viewMode === 'week') {
      const d = new Date(selectedDt);
      d.setDate(selectedDt.getDate() + dir * 7);
      setSelected(toDateStr(d));
    } else {
      const d = new Date(dispYear, dispMonth + dir, 1);
      setDispYear(d.getFullYear());
      setDispMonth(d.getMonth());
    }
  };

  const handleToggleView = (mode: 'week' | 'month') => {
    if (mode === 'month') {
      setDispYear(selYear);
      setDispMonth(selMonth);
    }
    setViewMode(mode);
  };

  const handleSelectDay = (ds: string) => {
    setSelected(ds);
    if (viewMode === 'month') {
      const d = new Date(ds + 'T12:00:00');
      setDispYear(d.getFullYear());
      setDispMonth(d.getMonth());
    }
  };

  const selectedLabel = selectedDt.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isExpoGo ? insets.bottom + 90 : 28 }}
      >
        {/* ── Black hero ── */}
        <LinearGradient
          colors={dark ? ['#1E293B', '#0F172A'] : ['#111827', '#374151']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroDec} />

          {/* Title + budget */}
          <View style={s.heroTop}>
            <Text style={s.heroTitle}>Calendario</Text>
            {monthTotal > 0 && (
              <View style={s.heroPill}>
                <Text style={s.heroPillText}>${monthTotal.toFixed(0)} este mes</Text>
              </View>
            )}
          </View>

          {/* View mode toggle */}
          <View style={s.viewToggle}>
            <TouchableOpacity
              style={[s.viewBtn, viewMode === 'week' && s.viewBtnActive]}
              onPress={() => handleToggleView('week')}
            >
              <Ionicons name="swap-horizontal-outline" size={13} color={viewMode === 'week' ? '#111827' : 'rgba(255,255,255,0.7)'} />
              <Text style={[s.viewBtnText, viewMode === 'week' && { color: '#111827' }]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.viewBtn, viewMode === 'month' && s.viewBtnActive]}
              onPress={() => handleToggleView('month')}
            >
              <Ionicons name="calendar-outline" size={13} color={viewMode === 'month' ? '#111827' : 'rgba(255,255,255,0.7)'} />
              <Text style={[s.viewBtnText, viewMode === 'month' && { color: '#111827' }]}>Mes</Text>
            </TouchableOpacity>
          </View>

          {/* Month nav */}
          <View style={s.monthRow}>
            <TouchableOpacity onPress={() => shiftPeriod(-1)} style={s.navBtn}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <Text style={s.monthLabel}>{MONTHS[heroMonth]} {heroYear}</Text>
            <TouchableOpacity onPress={() => shiftPeriod(1)} style={s.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Week strip — shown only in week mode */}
          {viewMode === 'week' && (
            <View style={s.weekStrip}>
              {weekDays.map((day, i) => {
                const ds      = toDateStr(day);
                const isSel   = ds === selected;
                const isToday = ds === todayStr;
                const daySubs = subsOnDate(subscriptions, day.getFullYear(), day.getMonth(), day.getDate());
                return (
                  <TouchableOpacity
                    key={i}
                    style={s.weekCol}
                    onPress={() => setSelected(ds)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.weekDayName, { color: isSel ? '#fff' : 'rgba(255,255,255,0.45)' }]}>
                      {DAYS_SHORT[day.getDay()]}
                    </Text>
                    <View style={[
                      s.weekCircle,
                      isSel   && { backgroundColor: '#fff' },
                      isToday && !isSel && { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' },
                    ]}>
                      <Text style={[
                        s.weekNum,
                        { color: isSel ? '#111827' : isToday ? '#fff' : 'rgba(255,255,255,0.85)' },
                        isSel && { fontWeight: '800' },
                      ]}>
                        {day.getDate()}
                      </Text>
                    </View>
                    {daySubs.length > 0
                      ? <View style={[s.weekDot, { backgroundColor: isSel ? '#111827' : daySubs[0].color }]} />
                      : <View style={s.weekDotGhost} />
                    }
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </LinearGradient>

        {/* ── Month grid (shown below hero when in month mode) ── */}
        {viewMode === 'month' && (
          <View style={[s.monthCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MonthGrid
              displayYear={dispYear}
              displayMonth={dispMonth}
              selected={selected}
              todayStr={todayStr}
              subscriptions={subscriptions}
              colors={colors}
              dark={dark}
              onSelect={handleSelectDay}
            />
          </View>
        )}

        {/* ── Selected day events ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]} numberOfLines={1}>
            {selectedSubs.length > 0 ? selectedLabel : 'Sin pagos este día'}
          </Text>
          {selectedSubs.length > 0 && (
            <View style={[s.totalPill, { backgroundColor: colors.primary }]}>
              <Text style={[s.totalPillText, { color: colors.primaryText }]}>
                ${selectedSubs.reduce((t, sub) => t + sub.price, 0).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {selectedSubs.length > 0 ? (
          <View style={s.cardCol}>
            {selectedSubs.map(sub => {
              const d = daysUntil(sub.next_renewal);
              const urg = d <= 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`;
              const isUrgent = d <= 3;
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[s.eventCard, {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    borderLeftColor: sub.color,
                  }]}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  activeOpacity={0.75}
                >
                  <SubIcon name={sub.name} color={sub.color} size={46} borderRadius={14} />
                  <View style={s.eventInfo}>
                    <Text style={[s.eventName, { color: colors.text }]}>{sub.name}</Text>
                    <View style={s.eventMeta}>
                      <View style={[s.eventPill, { backgroundColor: sub.color + '22' }]}>
                        <Text style={[s.eventPillText, { color: sub.color }]}>
                          {sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                        </Text>
                      </View>
                      <Text style={[s.eventSub, { color: colors.subtext }]}>
                        {PAYMENT_METHOD_LABELS[sub.payment_method] ?? 'Otro'}
                      </Text>
                    </View>
                  </View>
                  <View style={s.eventRight}>
                    <Text style={[s.eventPrice, { color: colors.text }]}>${sub.price.toFixed(2)}</Text>
                    <View style={[s.urgPill, {
                      backgroundColor: isUrgent
                        ? (dark ? '#4C0519' : '#FEF2F2')
                        : (dark ? '#1E293B' : '#F1F5F9'),
                    }]}>
                      <Text style={[s.urgText, { color: isUrgent ? colors.urgent : colors.subtext }]}>{urg}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            </View>
            <Text style={[s.emptyText, { color: colors.subtext }]}>Sin pagos programados para este día</Text>
          </View>
        )}

        {/* ── Otros pagos del mes (week mode only) ── */}
        {otherSubs.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Otros pagos del mes</Text>
            </View>
            <View style={s.cardCol}>
              {otherSubs.map(({ sub, dateStr }) => (
                <TouchableOpacity
                  key={sub.id + dateStr}
                  style={[s.eventCard, {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    borderLeftColor: sub.color,
                  }]}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  activeOpacity={0.75}
                >
                  <SubIcon name={sub.name} color={sub.color} size={46} borderRadius={14} />
                  <View style={s.eventInfo}>
                    <Text style={[s.eventName, { color: colors.text }]}>{sub.name}</Text>
                    <Text style={[s.eventSub, { color: colors.subtext }]}>
                      {new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                  <Text style={[s.eventPrice, { color: colors.text }]}>${sub.price.toFixed(2)}</Text>
                </TouchableOpacity>
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

  // Hero
  hero: { paddingTop: 20, paddingBottom: 24, overflow: 'hidden' },
  heroDec: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.03)', top: -90, right: -70,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  heroPillText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  // View mode toggle
  viewToggle: {
    flexDirection: 'row', alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
    padding: 3, gap: 2, marginBottom: 16,
  },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18,
  },
  viewBtnActive: { backgroundColor: '#fff' },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },

  // Month nav
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, marginBottom: 16,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  // Week strip
  weekStrip: { flexDirection: 'row', paddingHorizontal: 10 },
  weekCol: { flex: 1, alignItems: 'center', gap: 6 },
  weekDayName: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  weekCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  weekNum: { fontSize: 15, fontWeight: '600' },
  weekDot: { width: 5, height: 5, borderRadius: 3 },
  weekDotGhost: { width: 5, height: 5 },

  // Month card (below hero in month mode)
  monthCard: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },

  // Section header
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, flex: 1 },
  totalPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  totalPillText: { fontSize: 13, fontWeight: '700' },

  // Event cards
  cardCol: { marginHorizontal: 16, gap: 10 },
  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 4,
    padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 15, fontWeight: '700' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  eventPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  eventPillText: { fontSize: 11, fontWeight: '700' },
  eventSub: { fontSize: 12 },
  eventRight: { alignItems: 'flex-end', gap: 5 },
  eventPrice: { fontSize: 16, fontWeight: '800' },
  urgPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  urgText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, gap: 12,
  },
  emptyIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
