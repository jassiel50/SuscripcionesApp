import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  FlatList, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface Props { onAdd: () => void }

const FILTERS = ['Todas', 'Streaming', 'Productividad', 'Nube', 'Salud'];

const PAYMENTS = [
  { id: '1', name: 'Netflix',       category: 'Streaming',     renewal: 'Mañana',      price: 15.99, bg: '#E50914', letter: 'N', urgent: true  },
  { id: '2', name: 'Spotify',       category: 'Streaming',     renewal: '14 oct',      price: 9.99,  bg: '#1DB954', letter: 'S', urgent: false },
  { id: '3', name: 'Apple iCloud+', category: 'Nube',          renewal: '28 jun',      price: 2.99,  bg: '#3478F6', letter: 'A', urgent: false },
  { id: '4', name: 'Notion',        category: 'Productividad', renewal: '3 nov',       price: 8.00,  bg: '#191919', letter: 'N', urgent: false },
  { id: '5', name: 'Adobe CC',      category: 'Productividad', renewal: '20 nov',      price: 54.99, bg: '#FF0000', letter: 'A', urgent: false },
];

export default function DashboardScreen({ onAdd }: Props) {
  const { colors, dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('Todas');

  const filtered = activeFilter === 'Todas'
    ? PAYMENTS
    : PAYMENTS.filter(p => p.category === activeFilter);

  const total = PAYMENTS.reduce((s, p) => s + p.price, 0);
  const budget = 500;
  const pct = Math.min((total / budget) * 100, 100);

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.greeting, { color: colors.subtext }]}>Bienvenido de vuelta</Text>
          <Text style={[s.userName, { color: colors.text }]}>Mis Suscripciones</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.avatar, { backgroundColor: colors.accent }]}
            onPress={onAdd}
          >
            <Text style={s.avatarInitial}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Spending Card (dark) */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.spendingCard}
        >
          {/* Decorative circles */}
          <View style={s.decCircle1} />
          <View style={s.decCircle2} />

          <View style={s.spendingTop}>
            <Text style={s.spendingLabel}>Gasto mensual</Text>
            <View style={s.budgetBadge}>
              <Text style={s.budgetBadgeText}>de ${budget}</Text>
            </View>
          </View>
          <Text style={s.spendingAmount}>${total.toFixed(2)}</Text>
          <Text style={s.spendingPct}>{pct.toFixed(0)}% del presupuesto usado</Text>

          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${pct}%` as any }]} />
          </View>

          <View style={s.spendingFooter}>
            <View style={s.spendingStat}>
              <Text style={s.spendingStatNum}>{PAYMENTS.length}</Text>
              <Text style={s.spendingStatLabel}>Activas</Text>
            </View>
            <View style={[s.spendingDivider]} />
            <View style={s.spendingStat}>
              <Text style={s.spendingStatNum}>
                {PAYMENTS.filter(p => p.urgent).length}
              </Text>
              <Text style={s.spendingStatLabel}>Próximas</Text>
            </View>
            <View style={s.spendingDivider} />
            <TouchableOpacity style={s.addSubBtn} onPress={onAdd}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.addSubBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
        >
          {FILTERS.map(f => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  s.chip,
                  active
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.card },
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[
                  s.chipText,
                  { color: active ? '#fff' : colors.subtext },
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista */}
        <View style={s.listSection}>
          <View style={s.listHeader}>
            <Text style={[s.listTitle, { color: colors.text }]}>
              {filtered.length} suscripci{filtered.length === 1 ? 'ón' : 'ones'}
            </Text>
            <TouchableOpacity>
              <Text style={[s.listLink, { color: colors.accent }]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {filtered.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[s.subCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              activeOpacity={0.75}
            >
              <View style={[s.subAvatar, { backgroundColor: item.bg }]}>
                <Text style={s.subAvatarLetter}>{item.letter}</Text>
              </View>
              <View style={s.subInfo}>
                <Text style={[s.subName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[s.subCategory, { color: colors.subtext }]}>{item.category}</Text>
              </View>
              <View style={s.subRight}>
                <Text style={[s.subPrice, { color: colors.text }]}>${item.price.toFixed(2)}</Text>
                <View style={[
                  s.renewalChip,
                  { backgroundColor: item.urgent ? '#FEF2F2' : colors.accentSoft },
                ]}>
                  <Text style={[
                    s.renewalText,
                    { color: item.urgent ? colors.urgent : colors.accent },
                  ]}>
                    {item.renewal}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '700' },

  scroll: { paddingBottom: 32 },

  /* Spending Card */
  spendingCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  decCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -40,
  },
  decCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30, left: 20,
  },
  spendingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  spendingLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  budgetBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  budgetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  spendingAmount: { color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  spendingPct: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 14 },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 18 },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  spendingFooter: { flexDirection: 'row', alignItems: 'center' },
  spendingStat: { alignItems: 'center', flex: 1 },
  spendingStatNum: { color: '#fff', fontSize: 20, fontWeight: '700' },
  spendingStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  spendingDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  addSubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingVertical: 8,
    marginLeft: 12,
  },
  addSubBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* Filters */
  filtersRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  /* Lista */
  listSection: { paddingHorizontal: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  listLink: { fontSize: 13, fontWeight: '500' },
  subCard: {
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
  subAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subAvatarLetter: { fontSize: 18, fontWeight: '800', color: '#fff' },
  subInfo: { flex: 1 },
  subName: { fontSize: 15, fontWeight: '600' },
  subCategory: { fontSize: 12, marginTop: 3 },
  subRight: { alignItems: 'flex-end', gap: 6 },
  subPrice: { fontSize: 15, fontWeight: '700' },
  renewalChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  renewalText: { fontSize: 11, fontWeight: '600' },
});
