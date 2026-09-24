import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface Props { onAdd: () => void }

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEK_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TODAY = 15;
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const DUE_BY_DAY: Record<number, { name: string; price: string; bg: string; letter: string; status: string; statusColor: string; statusBg: string }[]> = {
  3:  [{ name: 'Notion',  price: '$8.00',  bg: '#191919', letter: 'N', status: 'Pendiente', statusColor: '#64748B', statusBg: '#F1F5F9' }],
  12: [{ name: 'Adobe CC', price: '$54.99', bg: '#FF0000', letter: 'A', status: 'Auto-pago', statusColor: '#7C3AED', statusBg: '#EDE9FE' }],
  15: [
    { name: 'Netflix',  price: '$15.99', bg: '#E50914', letter: 'N', status: 'Auto-pago', statusColor: '#7C3AED', statusBg: '#EDE9FE' },
    { name: 'Spotify',  price: '$9.99',  bg: '#1DB954', letter: 'S', status: 'Pendiente', statusColor: '#64748B', statusBg: '#F1F5F9' },
  ],
  23: [{ name: 'Apple iCloud+', price: '$2.99', bg: '#3478F6', letter: 'A', status: 'Auto-pago', statusColor: '#7C3AED', statusBg: '#EDE9FE' }],
};

const DOT_DAYS = new Set(Object.keys(DUE_BY_DAY).map(Number));

export default function CalendarScreen({ onAdd }: Props) {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState(TODAY);

  const dueTodayTotal = (DUE_BY_DAY[selectedDay] ?? [])
    .reduce((s, i) => s + parseFloat(i.price.replace('$', '')), 0);

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.headerSub, { color: colors.subtext }]}>Octubre 2023</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>Calendario</Text>
        </View>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.accent }]} onPress={onAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Resumen del mes */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.summaryBar}
      >
        <View style={s.summaryStat}>
          <Text style={s.summaryNum}>$91.97</Text>
          <Text style={s.summaryLabel}>Este mes</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryStat}>
          <Text style={s.summaryNum}>5</Text>
          <Text style={s.summaryLabel}>Pagos</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryStat}>
          <Text style={s.summaryNum}>2</Text>
          <Text style={s.summaryLabel}>Próximos</Text>
        </View>
      </LinearGradient>

      {/* Date strip horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.dateStrip}
      >
        {DAYS.map(d => {
          const active = d === selectedDay;
          const hasEvent = DOT_DAYS.has(d);
          const dayOfWeek = WEEK_SHORT[(d + 6) % 7];
          return (
            <TouchableOpacity
              key={d}
              style={s.dayBtn}
              onPress={() => setSelectedDay(d)}
            >
              <Text style={[s.dayName, { color: active ? colors.accent : colors.subtext }]}>
                {dayOfWeek}
              </Text>
              <View style={[
                s.dayCircle,
                active && { backgroundColor: colors.accent },
              ]}>
                <Text style={[
                  s.dayNum,
                  { color: active ? '#fff' : colors.text },
                  active && { fontWeight: '700' },
                ]}>
                  {d}
                </Text>
              </View>
              {hasEvent && (
                <View style={[s.dot, { backgroundColor: active ? colors.accent : colors.urgent }]} />
              )}
              {!hasEvent && <View style={s.dotPlaceholder} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Eventos del día */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {(DUE_BY_DAY[selectedDay] ?? []).length > 0 ? (
          <>
            <View style={s.dayHeader}>
              <Text style={[s.dayHeaderTitle, { color: colors.text }]}>
                {selectedDay} de Octubre
              </Text>
              {dueTodayTotal > 0 && (
                <View style={[s.totalBadge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[s.totalBadgeText, { color: colors.accent }]}>
                    Total ${dueTodayTotal.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {(DUE_BY_DAY[selectedDay] ?? []).map((item, i) => (
              <View
                key={i}
                style={[s.eventCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              >
                <View style={[s.eventAvatar, { backgroundColor: item.bg }]}>
                  <Text style={s.eventLetter}>{item.letter}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={[s.eventName, { color: colors.text }]}>{item.name}</Text>
                  <View style={[s.statusChip, { backgroundColor: item.statusBg }]}>
                    <Text style={[s.statusText, { color: item.statusColor }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={[s.eventPrice, { color: colors.text }]}>{item.price}</Text>
              </View>
            ))}
          </>
        ) : (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.accent} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Sin vencimientos</Text>
            <Text style={[s.emptyDesc, { color: colors.subtext }]}>
              No hay pagos programados para el {selectedDay} de Octubre.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSub: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  summaryBar: {
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  dateStrip: { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  dayBtn: { alignItems: 'center', paddingHorizontal: 6, minWidth: 46 },
  dayName: { fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  dayCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dayNum: { fontSize: 15 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  dotPlaceholder: { width: 5, height: 5, marginTop: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  dayHeaderTitle: { fontSize: 16, fontWeight: '700' },
  totalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  totalBadgeText: { fontSize: 12, fontWeight: '700' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eventAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  eventLetter: { color: '#fff', fontSize: 18, fontWeight: '800' },
  eventInfo: { flex: 1, gap: 6 },
  eventName: { fontSize: 15, fontWeight: '600' },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  eventPrice: { fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
