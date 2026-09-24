import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import { CardChip } from '../../src/components/CardPickerModal';
import { Gauge, GradientButton, GradientCircle, NotchCard, Tag, type IoniconName } from '../../src/components/ui';
import { SubIcon } from '../../src/utils/brandIcons';
import { daysUntilRenewal, monthlyEquivalent, nextRenewalDate, relativeDayLabel } from '../../src/utils/dates';
import { money, moneyParts, moneyShort } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import { CATEGORY_COLORS, CATEGORY_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../src/types';

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
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await remove(sub); router.back(); } },
    ]);
  };

  const copyClabe = async (clabe: string) => {
    await Clipboard.setStringAsync(clabe);
    if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
    else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
  };

  const rows: { icon: IoniconName; label: string; value: string; tint: string }[] = [
    { icon: 'calendar', label: 'Próximo cobro', value: next.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }), tint: urgent ? colors.urgent : colors.accent },
    { icon: 'repeat', label: 'Ciclo', value: sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual', tint: colors.success },
    { icon: PAYMENT_ICON[sub.payment_method] ?? 'card-outline', label: 'Método de pago', value: PAYMENT_METHOD_LABELS[sub.payment_method] ?? 'Otro', tint: '#7C5CFA' },
    { icon: sub.remind_me ? 'notifications' : 'notifications-off', label: 'Recordatorio', value: sub.remind_me ? '1 día antes' : 'Desactivado', tint: colors.warning },
    { icon: 'time', label: 'Agregada', value: new Date(sub.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }), tint: colors.subtext },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Hero con muesca */}
        <NotchCard
          fill={colors.surface}
          notch={84}
          style={s.hero}
          badge={<GradientCircle size={62} icon="pencil" iconSize={24} onPress={() => router.push(`/subscription/new?id=${sub.id}`)} accessibilityLabel="Editar" />}
        >
          <View style={{ paddingRight: 84 }}>
            <Tag label={CATEGORY_LABELS[sub.category]} color={CATEGORY_COLORS[sub.category]} solid />
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
            <SubIcon name={sub.name} color={sub.color} size={96} borderRadius={48} />
          </View>
        </NotchCard>

        {/* Gauges */}
        <View style={s.gauges}>
          <View style={[s.gaugeCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>Siguiente cobro</Text>
            <Gauge value={cycleProgress} color={urgent ? colors.urgent : colors.accent}>
              <Ionicons name="hourglass-outline" size={16} color={colors.subtext} />
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.max(days, 0)}</Text>
              <Text style={[s.gaugeUnit, { color: colors.subtext }]}>{days === 1 ? 'día' : 'días'}</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>{relativeDayLabel(days)}</Text>
          </View>
          <View style={[s.gaugeCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.gaugeTitle, { color: colors.text }]}>De tu gasto</Text>
            <Gauge value={share} color="#7C5CFA">
              <Ionicons name="pie-chart-outline" size={16} color={colors.subtext} />
              <Text style={[s.gaugeValue, { color: colors.text }]}>{Math.round(share * 100)}%</Text>
            </Gauge>
            <Text style={[s.gaugeFoot, { color: colors.subtext }]}>{money(monthly)}/mes</Text>
          </View>
        </View>

        {/* Insights */}
        <View style={s.insights}>
          <View style={[s.insight, { backgroundColor: colors.accentSoft }]}>
            <Text style={[s.insightLabel, { color: colors.accent }]}>Al año</Text>
            <Text style={[s.insightValue, { color: colors.text }]}>{moneyShort(annual)}</Text>
          </View>
          <View style={[s.insight, { backgroundColor: colors.successSoft }]}>
            <Text style={[s.insightLabel, { color: colors.success }]}>Pagado aprox.</Text>
            <Text style={[s.insightValue, { color: colors.text }]}>{moneyShort(paidApprox)}</Text>
          </View>
        </View>

        {/* Detalles */}
        <Text style={[s.section, { color: colors.text }]}>Detalles</Text>
        <View style={[s.list, { backgroundColor: colors.surface }]}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
              <View style={[s.rowIcon, { backgroundColor: row.tint + '1F' }]}>
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
              style={[s.list, s.cardRow, { backgroundColor: colors.surface }]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.bodyBold, { color: colors.text }]}>{linkedCard.alias}</Text>
                {linkedCard.kind === 'clabe' && linkedCard.clabe
                  ? <Text style={[s.clabe, { color: colors.accent }]}>{linkedCard.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</Text>
                  : <Text style={{ color: colors.subtext, fontWeight: '600' }}>{linkedCard.bank}</Text>}
              </View>
              {linkedCard.kind === 'clabe'
                ? <Ionicons name="copy-outline" size={20} color={colors.accent} />
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
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  hero: { marginHorizontal: spacing.screen, marginTop: 8, padding: 22, minHeight: 260 },
  heroName: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 40, marginTop: 14 },
  heroDesc: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 12, maxWidth: '80%' },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 },
  heroPrice: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  heroDec: { fontSize: 18, fontWeight: '800' },
  heroPer: { fontSize: 13, fontWeight: '700' },

  gauges: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 14 },
  gaugeCard: { flex: 1, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', gap: 6 },
  gaugeTitle: { fontSize: 14, fontWeight: '800', alignSelf: 'flex-start', marginLeft: 16 },
  gaugeValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  gaugeUnit: { fontSize: 11, fontWeight: '700', marginTop: -2 },
  gaugeFoot: { fontSize: 13, fontWeight: '800' },

  insights: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 12 },
  insight: { flex: 1, borderRadius: radius.md, padding: 14, gap: 4 },
  insightLabel: { fontSize: 12, fontWeight: '800' },
  insightValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },

  section: { ...type.h2, marginHorizontal: spacing.screen, marginTop: 26, marginBottom: 12 },
  list: { marginHorizontal: spacing.screen, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  rowValue: { fontSize: 14, fontWeight: '800', maxWidth: '55%' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  clabe: { fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },

  actions: { flexDirection: 'row', gap: 12, marginHorizontal: spacing.screen, marginTop: 28 },
  delete: { width: 58, borderRadius: 29, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
