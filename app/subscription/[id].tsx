import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import { CardChip } from '../../src/components/CardPickerModal';
import {
  GradientButton, GradientCircle, NotchCard, ProgressBar, ScreenBackground, StackHeader, Tag, useStackHeaderSpace,
  type IoniconName,
} from '../../src/components/ui';
import { enter, successHaptic } from '../../src/theme/motion';
import { SubIcon, brandColor } from '../../src/utils/brandIcons';
import { daysUntilRenewal, monthlyEquivalent, nextRenewalDate, relativeDayLabel } from '../../src/utils/dates';
import { money, moneyParts, moneyShort } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import { CATEGORY_LABELS, CATEGORY_VIVID_INDEX, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../src/types';

/** Fondo suave para una insignia de color a partir de su tinte (hex u rgba). */
function badgeBg(tint: string, fallback: string): string {
  return tint.startsWith('#') ? tint + '22' : fallback;
}

const PAYMENT_ICON: Record<PaymentMethod, IoniconName> = {
  credit_card: 'card-outline', debit_card: 'card', paypal: 'logo-paypal',
  bank_transfer: 'swap-horizontal-outline', cash: 'cash-outline', other: 'ellipsis-horizontal',
};

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subscriptions, remove, monthlyTotal } = useSubscriptions();
  const { colors } = useTheme();
  const { cards } = usePaymentCards();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerSpace = useStackHeaderSpace();

  const sub = subscriptions.find(s => s.id === id) ?? null;
  const linkedCard = sub?.card_id ? cards.find(c => c.id === sub.card_id) ?? null : null;

  if (!sub) {
    return (
      <View style={[s.root, s.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.subtext }}>Cargando…</Text>
      </View>
    );
  }

  const days = daysUntilRenewal(sub);
  const next = nextRenewalDate(sub);
  const urgent = days <= 3;
  // Color de marca del servicio: tiñe el fondo y la barra de progreso.
  const tint = brandColor(sub.name, sub.color, colors.vivid);
  const cycleDays = sub.billing_cycle === 'yearly' ? 365 : 30;
  const cycleProgress = Math.max(0, Math.min(1, 1 - days / cycleDays));
  const monthly = monthlyEquivalent(sub);
  const share = monthlyTotal > 0 ? monthly / monthlyTotal : 0;
  const annual = monthly * 12;
  const monthsActive = Math.max(0, Math.floor((Date.now() - new Date(sub.created_at).getTime()) / (30.44 * 86400000)));
  const paidApprox = monthsActive * monthly;
  const { int, dec } = moneyParts(sub.price);

  const handleDelete = () => {
    Alert.alert('Eliminar suscripción', `¿Eliminar ${sub.name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await remove(sub); successHaptic(); router.back(); } },
    ]);
  };

  const copyClabe = async (clabe: string) => {
    await Clipboard.setStringAsync(clabe);
    if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
    else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
  };

  // Un color por tipo de dato (calendario=índigo, ciclo=verde, pago=violeta,
  // recordatorio=ámbar), como en Estadísticas — nada de íconos monocromos.
  const rows: { icon: IoniconName; label: string; value: string; tint: string }[] = [
    { icon: 'calendar', label: 'Próximo cobro', value: next.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }), tint: urgent ? colors.urgent : colors.vivid[0] },
    { icon: 'repeat', label: 'Ciclo', value: sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual', tint: colors.vivid[3] },
    { icon: PAYMENT_ICON[sub.payment_method] ?? 'card-outline', label: 'Método de pago', value: PAYMENT_METHOD_LABELS[sub.payment_method] ?? 'Otro', tint: colors.vivid[5] },
    { icon: sub.remind_me ? 'notifications' : 'notifications-off', label: 'Recordatorio', value: sub.remind_me ? '1 día antes' : 'Desactivado', tint: sub.remind_me ? colors.vivid[2] : colors.subtext },
    { icon: 'time', label: 'Agregada', value: new Date(sub.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }), tint: colors.subtext },
  ];

  return (
    <View style={s.root}>
      <ScreenBackground scene="neutral" tint={tint} />
      <StackHeader onBack={() => router.back()} />
      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: headerSpace + 4, paddingBottom: insets.bottom + 32 }}>

        {/* Hero con muesca */}
        <Animated.View entering={enter(0)}>
        <NotchCard
          fill={colors.surface}
          notch={84}
          style={s.hero}
          badge={<GradientCircle size={62} icon="pencil" iconSize={24} onPress={() => router.push(`/subscription/new?id=${sub.id}`)} accessibilityLabel="Editar" />}
        >
          <View style={{ paddingRight: 84 }}>
            <Tag label={CATEGORY_LABELS[sub.category]} color={colors.vivid[CATEGORY_VIVID_INDEX[sub.category]]} solid />
            <Text style={[s.heroName, { color: colors.text }]} numberOfLines={2}>{sub.name}</Text>
          </View>
          <Text style={[s.heroDesc, { color: colors.text }]} numberOfLines={3}>
            {sub.description?.trim() || `${relativeDayLabel(days)} se cobra en tu ${PAYMENT_METHOD_LABELS[sub.payment_method]?.toLowerCase() ?? 'método de pago'}.`}
          </Text>
          <View style={s.heroBottom}>
            <View>
              <Text style={[s.heroPrice, { color: colors.text }]}>{int}<Text style={s.heroDec}>.{dec}</Text></Text>
              <Text style={[s.heroPer, { color: colors.subtext }]}>{sub.billing_cycle === 'monthly' ? 'por mes' : 'por año'}</Text>
            </View>
            <SubIcon name={sub.name} color={sub.color} icon={sub.icon} size={96} borderRadius={48} />
          </View>
        </NotchCard>
        </Animated.View>

        {/* Progreso del ciclo (barra simple: más clara que un medidor aquí) */}
        <Animated.View entering={enter(1)} style={[s.cycle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={s.cycleTop}>
            <Text style={[type.h3, { color: colors.text }]}>Siguiente cobro</Text>
            <Text style={[s.cycleDays, { color: urgent ? colors.urgent : colors.text }]}>{relativeDayLabel(days)}</Text>
          </View>
          <ProgressBar value={Math.max(cycleProgress, 0.03)} colors={urgent ? colors.chartBad : [tint + '88', tint]} height={8} delay={350} />
          <Text style={[s.cycleFoot, { color: colors.subtext }]}>
            {next.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </Animated.View>

        {/* Cifras clave */}
        <Animated.View entering={enter(2)} style={s.insights}>
          {[
            { label: 'Al mes', value: moneyShort(monthly) },
            { label: 'Al año', value: moneyShort(annual) },
            { label: 'De tu gasto', value: `${Math.round(share * 100)}%` },
          ].map(it => (
            <View key={it.label} style={[s.insight, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[s.insightValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{it.value}</Text>
              <Text style={[s.insightLabel, { color: colors.subtext }]}>{it.label}</Text>
            </View>
          ))}
        </Animated.View>
        {paidApprox > 0 && (
          <Text style={[s.paid, { color: colors.subtext }]}>
            Llevas aprox. <Text style={{ color: colors.text, fontWeight: '700' }}>{moneyShort(paidApprox)}</Text> pagados desde que la agregaste.
          </Text>
        )}

        {/* Detalles */}
        <Text style={[s.section, { color: colors.text }]}>Detalles</Text>
        <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
              <View style={[s.rowIcon, { backgroundColor: row.tint === colors.urgent ? colors.urgentSoft : badgeBg(row.tint, colors.accentSoft) }]}>
                <Ionicons name={row.icon} size={17} color={row.tint} />
              </View>
              <Text style={[s.rowLabel, { color: colors.subtext }]} numberOfLines={1}>{row.label}</Text>
              <Text style={[s.rowValue, { color: colors.text }]} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Tarjeta vinculada */}
        {linkedCard && (
          <>
            <Text style={[s.section, { color: colors.text }]}>Tarjeta / CLABE</Text>
            <Pressable
              disabled={!(linkedCard.kind === 'clabe' && linkedCard.clabe)}
              onPress={() => linkedCard.clabe && copyClabe(linkedCard.clabe)}
              style={[s.list, s.cardRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.bodyBold, { color: colors.text }]}>{linkedCard.alias}</Text>
                {linkedCard.kind === 'clabe' && linkedCard.clabe
                  ? <Text style={[s.clabe, { color: colors.vivid[0] }]}>{linkedCard.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</Text>
                  : <Text style={{ color: colors.subtext, fontWeight: '400' }}>{linkedCard.bank}</Text>}
              </View>
              {linkedCard.kind === 'clabe'
                ? <View style={[s.copyIcon, { backgroundColor: badgeBg(colors.vivid[0], colors.accentSoft) }]}>
                    <Ionicons name="copy-outline" size={16} color={colors.vivid[0]} />
                  </View>
                : <CardChip card={linkedCard} colors={colors} />}
            </Pressable>
          </>
        )}

        {/* Acciones */}
        <View style={s.actions}>
          <GradientButton label="Editar" icon="pencil" onPress={() => router.push(`/subscription/new?id=${sub.id}`)} style={{ flex: 1 }} />
          <Pressable onPress={handleDelete} style={[s.delete, { borderColor: colors.urgent }]} accessibilityRole="button" accessibilityLabel="Eliminar suscripción">
            <Ionicons name="trash-outline" size={20} color={colors.urgent} />
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  hero: { marginHorizontal: spacing.screen, marginTop: 8, padding: 22, minHeight: 260 },
  heroName: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 40, marginTop: 14 },
  heroDesc: { fontSize: 14, fontWeight: '500', lineHeight: 20, marginTop: 12, maxWidth: '80%' },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 },
  heroPrice: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  heroDec: { fontSize: 18, fontWeight: '800' },
  heroPer: { fontSize: 13, fontWeight: '500' },

  cycle: { marginHorizontal: spacing.screen, marginTop: 14, borderRadius: radius.lg, padding: 18, gap: 12 , borderWidth: StyleSheet.hairlineWidth },
  cycleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleDays: { fontSize: 15, fontWeight: '900' },
  cycleFoot: { fontSize: 13, fontWeight: '500' },

  insights: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 10 },
  insight: { flex: 1, borderRadius: radius.md, padding: 14, gap: 2 , borderWidth: StyleSheet.hairlineWidth },
  insightLabel: { fontSize: 12, fontWeight: '500' },
  insightValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  paid: { fontSize: 13, fontWeight: '400', marginHorizontal: spacing.screen, marginTop: 12 },

  section: { ...type.h2, marginHorizontal: spacing.screen, marginTop: 26, marginBottom: 12 },
  list: { marginHorizontal: spacing.screen, borderRadius: radius.lg, overflow: 'hidden' , borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '700', maxWidth: '55%' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  clabe: { fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  copyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  actions: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 28 },
  delete: { width: 58, borderRadius: 29, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
