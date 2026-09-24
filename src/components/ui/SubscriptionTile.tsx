import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { SubIcon, brandColor } from '../../utils/brandIcons';
import { CATEGORY_LABELS, CATEGORY_VIVID_INDEX, type Subscription } from '../../types';
import { daysUntilRenewal, nextRenewalDate, relativeDayLabel, shortDate } from '../../utils/dates';
import { money, moneyParts } from '../../utils/format';
import { radius, spacing, type } from '../../theme/tokens';
import { NotchCard } from './NotchCard';
import { GradientCircle, PressableScale, Tag } from './primitives';
import { ProgressBar } from './charts';

function cycleProgress(sub: Subscription): number {
  const days = daysUntilRenewal(sub);
  const total = sub.billing_cycle === 'yearly' ? 365 : 30;
  return Math.max(0.04, Math.min(1, 1 - days / total));
}

// ── Fila de lista ───────────────────────────────────────────────────────────

export function SubscriptionRow({ sub, onPress, dateLabel, inset }: { sub: Subscription; onPress: () => void; dateLabel?: string; inset?: number }) {
  const { colors } = useTheme();
  const days = daysUntilRenewal(sub);
  const urgent = days <= 3;
  return (
    <PressableScale onPress={onPress} style={[r.row, inset != null && { paddingHorizontal: inset }]} accessibilityRole="button" accessibilityLabel={`${sub.name}, ${money(sub.price)}`}>
      <SubIcon name={sub.name} color={sub.color} icon={sub.icon} size={52} borderRadius={26} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.h3, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
        <Text style={[r.meta, { color: colors.subtext }]} numberOfLines={1}>
          {dateLabel ?? `${CATEGORY_LABELS[sub.category]} · ${shortDate(nextRenewalDate(sub))}`}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[r.price, { color: colors.text }]}>{money(sub.price)}</Text>
        <View style={[r.chip, { backgroundColor: urgent ? colors.urgentSoft : colors.surface }]}>
          {urgent && <Ionicons name="alert-circle" size={11} color={colors.urgent} />}
          <Text style={[r.chipText, { color: urgent ? colors.urgent : colors.subtext }]}>
            {relativeDayLabel(days)}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

// ── Tile compacto (carrusel "Próximos pagos") ───────────────────────────────

export function UpcomingTile({ sub, onPress }: { sub: Subscription; onPress: () => void }) {
  const { colors } = useTheme();
  const days = daysUntilRenewal(sub);
  const urgent = days <= 3;
  const tint = urgent ? colors.urgent : colors.ink;
  const brand = brandColor(sub.name, sub.color, colors.vivid);
  return (
    <PressableScale onPress={onPress} style={[r.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} accessibilityRole="button">
      <View style={r.tileTop}>
        <SubIcon name={sub.name} color={sub.color} icon={sub.icon} size={40} borderRadius={20} />
        <View style={{ flex: 1 }}>
          <Text style={[r.tileName, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
          <Text style={[r.tileSub, { color: colors.subtext }]} numberOfLines={1}>{sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}</Text>
        </View>
      </View>
      <Text style={[r.tilePrice, { color: colors.text }]}>{money(sub.price)}</Text>
      <ProgressBar value={cycleProgress(sub)} colors={urgent ? [colors.urgent, colors.urgent] : [brand + '88', brand]} height={6} delay={300} />
      <Text style={[r.tileDays, { color: tint }]}>{relativeDayLabel(days)}</Text>
    </PressableScale>
  );
}

// ── Tarjeta destacada con muesca (estilo referencia) ────────────────────────

export function FeaturedSubscriptionCard({
  sub, onPress, label = 'Próximo cobro',
}: {
  sub: Subscription; onPress: () => void; label?: string;
}) {
  const { colors } = useTheme();
  const days = daysUntilRenewal(sub);
  const { int, dec } = moneyParts(sub.price);

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${label}: ${sub.name}`}>
      <NotchCard
        fill={colors.surface}
        notch={86}
        style={r.featured}
        badge={
          <GradientCircle size={66}>
            <Text style={[r.badgeNum, { color: colors.onInk }]}>{Math.max(days, 0)}</Text>
            <Text style={[r.badgeUnit, { color: colors.onInk }]}>{days === 1 ? 'día' : 'días'}</Text>
          </GradientCircle>
        }
      >
        <View style={{ paddingRight: 86 }}>
          <Tag label={label} color={days <= 3 ? colors.urgent : colors.vivid[CATEGORY_VIVID_INDEX[sub.category]]} solid />
          <Text style={[r.featuredName, { color: colors.text }]} numberOfLines={2}>{sub.name}</Text>
        </View>
        <Text style={[r.featuredDesc, { color: colors.text }]} numberOfLines={2}>
          {sub.description?.trim() || `${CATEGORY_LABELS[sub.category]} · ${sub.billing_cycle === 'monthly' ? 'se renueva cada mes' : 'se renueva cada año'} · ${shortDate(nextRenewalDate(sub))}`}
        </Text>
        <View style={r.featuredBottom}>
          <Text style={[r.featuredPrice, { color: colors.text }]}>
            {int}<Text style={r.featuredDec}>.{dec}</Text>
          </Text>
          <View style={[r.bigLogo, { backgroundColor: colors.bg }]}>
            <SubIcon name={sub.name} color={sub.color} icon={sub.icon} size={84} borderRadius={42} />
          </View>
        </View>
      </NotchCard>
    </PressableScale>
  );
}

const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.screen, paddingVertical: 10 },
  meta: { fontSize: 13, fontWeight: '500' },
  price: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  chipText: { fontSize: 11, fontWeight: '800' },

  tile: { width: 168, borderRadius: radius.lg, padding: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  tileSub: { fontSize: 11, fontWeight: '500' },
  tilePrice: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  tileDays: { fontSize: 12, fontWeight: '800' },

  featured: { marginHorizontal: spacing.screen, padding: 22, paddingBottom: 18 },
  badgeNum: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  badgeUnit: { opacity: 0.85, fontSize: 10, fontWeight: '600', marginTop: -2 },
  featuredName: { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 14, lineHeight: 38 },
  featuredDesc: { fontSize: 14, fontWeight: '500', lineHeight: 20, marginTop: 12, maxWidth: '78%' },
  featuredBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 },
  featuredPrice: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  featuredDec: { fontSize: 18, fontWeight: '800' },
  bigLogo: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
});
