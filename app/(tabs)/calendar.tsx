import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import {
  FilterPills, Glass, LargeTitle, PressableScale, ScreenBackground, SectionHeader, SubscriptionRow, TOP_BAR_H, TopBar,
  useScreenScroll, useTabBarSpace,
} from '../../src/components/ui';
import { brandColor } from '../../src/utils/brandIcons';
import { enter, listLayout, tapHaptic } from '../../src/theme/motion';
import { daysUntilDate, MONTHS, parseDate, relativeDayLabel, subsOnDate, toDateStr, totalForMonth } from '../../src/utils/dates';
import { money, moneyShort } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import type { Subscription } from '../../src/types';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type ViewMode = 'week' | 'month';

function getWeekDays(center: Date): Date[] {
  const mon = new Date(center);
  mon.setDate(center.getDate() - ((center.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function DayCell({
  date, selected, today, dots, onPress, compact,
}: {
  date: Date; selected: boolean; today: boolean; dots: string[]; onPress: () => void; compact?: boolean;
}) {
  const { colors } = useTheme();
  const size = compact ? 38 : 42;
  const num = (
    <Text style={[s.dayNum, { color: selected ? colors.onInk : colors.text }, (selected || today) && { fontWeight: '700' }]}>
      {date.getDate()}
    </Text>
  );
  return (
    <Pressable onPress={() => { tapHaptic(); onPress(); }} style={s.dayCell} accessibilityRole="button" accessibilityState={{ selected }}>
      {!compact && (
        <Text style={[s.dayName, { color: selected ? colors.text : colors.subtext }]}>{DAYS_SHORT[date.getDay()]}</Text>
      )}
      {selected ? (
        <Animated.View entering={ZoomIn.springify().damping(16).stiffness(260)}>
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.dayCircle, { width: size, height: size, borderRadius: size / 2 }]}>
            {num}
          </LinearGradient>
        </Animated.View>
      ) : (
        <View style={[s.dayCircle, { width: size, height: size, borderRadius: size / 2 }, today && { borderWidth: 2, borderColor: colors.accent }]}>
          {num}
        </View>
      )}
      <View style={s.dots}>
        {dots.slice(0, 3).map((c, i) => <View key={i} style={[s.dot, { backgroundColor: c }]} />)}
      </View>
    </Pressable>
  );
}

export default function CalendarScreen() {
  const { subscriptions } = useSubscriptions();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useScreenScroll();

  const today = new Date();
  const todayStr = toDateStr(today);

  const [selected, setSelected] = useState(todayStr);
  const [mode, setMode] = useState<ViewMode>('week');
  const [dispYear, setDispYear] = useState(today.getFullYear());
  const [dispMonth, setDispMonth] = useState(today.getMonth());

  const selectedDt = useMemo(() => parseDate(selected), [selected]);
  const weekDays = useMemo(() => getWeekDays(selectedDt), [selectedDt]);
  const selYear = selectedDt.getFullYear();
  const selMonth = selectedDt.getMonth();
  const year = mode === 'week' ? selYear : dispYear;
  const month = mode === 'week' ? selMonth : dispMonth;

  const monthTotal = useMemo(() => totalForMonth(subscriptions, year, month), [subscriptions, year, month]);

  const dotsFor = (d: Date) =>
    subsOnDate(subscriptions, d.getFullYear(), d.getMonth(), d.getDate()).map((sb, k) => brandColor(sb.name, sb.color, colors.vivid, k));

  const selectedSubs = useMemo(
    () => subsOnDate(subscriptions, selYear, selMonth, selectedDt.getDate()),
    [subscriptions, selYear, selMonth, selectedDt],
  );

  // Resto de cobros del mes a partir de hoy (excluye el día seleccionado)
  const restOfMonth = useMemo(() => {
    const last = new Date(year, month + 1, 0).getDate();
    const out: { sub: Subscription; date: Date }[] = [];
    for (let d = 1; d <= last; d++) {
      const date = new Date(year, month, d, 12);
      if (toDateStr(date) === selected || daysUntilDate(date) < 0) continue;
      for (const sub of subsOnDate(subscriptions, year, month, d)) out.push({ sub, date });
    }
    return out;
  }, [subscriptions, year, month, selected]);

  const shift = (dir: -1 | 1) => {
    if (mode === 'week') {
      const d = new Date(selectedDt);
      d.setDate(d.getDate() + dir * 7);
      setSelected(toDateStr(d));
    } else {
      const d = new Date(dispYear, dispMonth + dir, 1);
      setDispYear(d.getFullYear());
      setDispMonth(d.getMonth());
    }
  };

  const changeMode = (m: ViewMode) => {
    if (m === 'month') { setDispYear(selYear); setDispMonth(selMonth); }
    setMode(m);
  };

  const goToday = () => {
    setSelected(todayStr);
    setDispYear(today.getFullYear());
    setDispMonth(today.getMonth());
  };

  // Celdas del mes (semana inicia en lunes)
  const cells = useMemo(() => {
    const firstMon = (new Date(dispYear, dispMonth, 1).getDay() + 6) % 7;
    const n = new Date(dispYear, dispMonth + 1, 0).getDate();
    const arr: (Date | null)[] = [...Array(firstMon).fill(null), ...Array.from({ length: n }, (_, i) => new Date(dispYear, dispMonth, i + 1, 12))];
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [dispYear, dispMonth]);

  const rawLabel = selectedDt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const selectedLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const selectedTotal = selectedSubs.reduce((t, sb) => t + sb.price, 0);

  return (
    <View style={s.root}>
      <ScreenBackground scene="calendar" />
      <TopBar scrollY={scrollY} title="Calendario" />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + TOP_BAR_H - 12, paddingBottom: bottom }}
      >
        <LargeTitle
          scrollY={scrollY}
          title="Calendario"
          right={
            <PressableScale onPress={goToday} scaleTo={0.92} accessibilityLabel="Ir a hoy">
              <Glass radius={999} interactive>
                <Text style={[s.todayText, { color: colors.text }]}>Hoy</Text>
              </Glass>
            </PressableScale>
          }
        />
        <FilterPills<ViewMode>
          scroll={false}
          value={mode}
          onChange={changeMode}
          options={[{ key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }]}
        />

        {/* Tarjeta calendario */}
        <Animated.View entering={enter(0)} style={[s.calendar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={s.monthRow}>
            <Pressable onPress={() => shift(-1)} style={[s.nav, { backgroundColor: colors.glassStrong }]} accessibilityLabel="Anterior">
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={[type.h2, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
              <Text style={[s.monthTotal, { color: colors.subtext }]}>{moneyShort(monthTotal)} este mes</Text>
            </View>
            <Pressable onPress={() => shift(1)} style={[s.nav, { backgroundColor: colors.glassStrong }]} accessibilityLabel="Siguiente">
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          {mode === 'week' ? (
            <View style={s.week}>
              {weekDays.map(d => (
                <DayCell
                  key={toDateStr(d)}
                  date={d}
                  selected={toDateStr(d) === selected}
                  today={toDateStr(d) === todayStr}
                  dots={dotsFor(d)}
                  onPress={() => setSelected(toDateStr(d))}
                />
              ))}
            </View>
          ) : (
            <>
              <View style={s.week}>
                {DAY_LETTERS.map(l => <Text key={l} style={[s.letter, { color: colors.subtext }]}>{l}</Text>)}
              </View>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <View key={row} style={s.week}>
                  {cells.slice(row * 7, row * 7 + 7).map((d, col) => d ? (
                    <DayCell
                      key={col}
                      compact
                      date={d}
                      selected={toDateStr(d) === selected}
                      today={toDateStr(d) === todayStr}
                      dots={dotsFor(d)}
                      onPress={() => setSelected(toDateStr(d))}
                    />
                  ) : <View key={col} style={s.dayCell} />)}
                </View>
              ))}
            </>
          )}
        </Animated.View>

        {/* Día seleccionado */}
        <View style={s.dayHeader}>
          <Text style={[type.h2, { color: colors.text, flex: 1 }]} numberOfLines={1}>{selectedLabel}</Text>
          {selectedSubs.length > 0 && (
            <View style={[s.totalPill, { backgroundColor: colors.ink }]}>
              <Text style={[s.totalText, { color: colors.onInk }]}>{money(selectedTotal)}</Text>
            </View>
          )}
        </View>

        <Animated.View key={selected} entering={FadeIn.duration(260)} exiting={FadeOut.duration(120)} layout={listLayout}>
          {selectedSubs.length > 0 ? (
            selectedSubs.map(sub => (
              <SubscriptionRow key={sub.id} sub={sub} onPress={() => router.push(`/subscription/${sub.id}`)} />
            ))
          ) : (
            <View style={[s.free, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <Text style={[s.freeText, { color: colors.text }]}>Día libre de cobros</Text>
            </View>
          )}
        </Animated.View>

        {restOfMonth.length > 0 && (
          <>
            <SectionHeader title={`Resto de ${MONTHS[month].toLowerCase()}`} />
            {restOfMonth.map(({ sub, date }) => (
              <SubscriptionRow
                key={sub.id + toDateStr(date)}
                sub={sub}
                dateLabel={`${date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} · ${relativeDayLabel(daysUntilDate(date))}`}
                onPress={() => router.push(`/subscription/${sub.id}`)}
              />
            ))}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  todayText: { fontSize: 14, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 9 },

  calendar: { marginHorizontal: spacing.screen, marginTop: 16, borderRadius: radius.lg, padding: 14, paddingBottom: 10, borderWidth: StyleSheet.hairlineWidth },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTotal: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  nav: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  week: { flexDirection: 'row' },
  letter: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', paddingVertical: 6 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3, gap: 4 },
  dayName: { fontSize: 11, fontWeight: '600' },
  dayCircle: { alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 15, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screen, marginTop: 26, marginBottom: 8 },
  totalPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  totalText: { fontSize: 13, fontWeight: '900' },

  free: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.screen, marginTop: 6, borderRadius: radius.md, padding: 16 },
  freeText: { fontSize: 15, fontWeight: '600' },
});
