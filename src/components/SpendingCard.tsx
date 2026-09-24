import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '../hooks/useTheme';
import type { ThemeColors } from '../hooks/useTheme';

interface Props {
  monthlyTotal: number;
  budget?: number;
  count: number;
  onEditBudget?: () => void;
}

function CardContent({ monthlyTotal, budget = 500, count, onEditBudget }: Props) {
  const pct = Math.min((monthlyTotal / budget) * 100, 100);
  const isOverBudget = pct >= 85;

  return (
    <View>
      <View style={s.topRow}>
        <Text style={s.label}>Gasto mensual</Text>
        <TouchableOpacity
          style={s.budgetBadge}
          onPress={onEditBudget}
          disabled={!onEditBudget}
          hitSlop={8}
        >
          <Text style={s.budgetBadgeText}>de ${budget.toFixed(0)}</Text>
          {onEditBudget && <Ionicons name="pencil-outline" size={10} color="rgba(255,255,255,0.7)" />}
        </TouchableOpacity>
      </View>

      <Text style={s.amount}>${monthlyTotal.toFixed(2)}</Text>
      <Text style={s.pctLabel}>{pct.toFixed(0)}% del presupuesto usado</Text>

      <View style={s.progressBg}>
        <View style={[
          s.progressFill,
          { width: `${pct}%` as any, backgroundColor: isOverBudget ? '#FCA5A5' : '#fff' },
        ]} />
      </View>

      <View style={s.footer}>
        <View style={s.stat}>
          <Text style={s.statNum}>{count}</Text>
          <Text style={s.statLabel}>Activas</Text>
        </View>
        <View style={s.footerDivider} />
        <View style={s.stat}>
          <Text style={s.statNum}>${(budget - monthlyTotal).toFixed(0)}</Text>
          <Text style={s.statLabel}>Disponible</Text>
        </View>
        <View style={s.footerDivider} />
        <View style={s.stat}>
          <Text style={s.statNum}>${(monthlyTotal * 12).toFixed(0)}</Text>
          <Text style={s.statLabel}>Anual est.</Text>
        </View>
      </View>
    </View>
  );
}

export default function SpendingCard(props: Props) {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassContainer style={s.glassOuter}>
        <GlassView glassEffectStyle="regular" style={s.glassInner}>
          <CardContent {...props} />
        </GlassView>
      </GlassContainer>
    );
  }

  return (
    <LinearGradient
      colors={['#1E3A8A', '#2563EB', '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={s.decCircle1} />
      <View style={s.decCircle2} />
      <CardContent {...props} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  glassOuter: { marginHorizontal: 16, marginBottom: 4, borderRadius: 20 },
  glassInner: { borderRadius: 20, padding: 20 },
  decCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50,
  },
  decCircle2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  budgetBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  budgetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  amount: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -1, marginBottom: 2 },
  pctLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 12 },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 18 },
  progressFill: { height: 4, borderRadius: 2 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 17, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  footerDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
});
