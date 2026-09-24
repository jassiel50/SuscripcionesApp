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
import { GradientButton, GradientCircle, NotchCard, Tag, type IoniconName } from '../../src/components/ui';
import { SubIcon } from '../../src/utils/brandIcons';
import { daysUntilRenewal, monthlyEquivalent, nextRenewalDate, relativeDayLabel } from '../../src/utils/dates';
import { money, moneyParts, moneyShort } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';
import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../src/types';

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
    { icon: 'calendar', label: 'Próximo cobro', value: next.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }), tint: urgent ? colors.urgent : colors.text },
    { icon: 'repeat', label: 'Ciclo', value: sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual', tint: colors.text },
    { icon: PAYMENT_ICON[sub.payment_method] ?? 'card-outline', label: 'Método de pago', value: PAYMENT_METHOD_LABELS[sub.payment_method] ?? 'Otro', tint: colors.text },
    { icon: sub.remind_me ? 'notifications' : 'notifications-off', label: 'Recordatorio', value: sub.remind_me ? '1 día antes' : 'Desactivado', tint: colors.text },
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
            <Tag label={CATEGORY_LABELS[sub.category]} solid />
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

        {/* Progreso del ciclo (barra simple: más clara que un medidor aquí) */}
        <View style={[s.cycle, { backgroundColor: colors.surface }]}>
          <View style={s.cycleTop}>
            <Text style={[type.h3, { color: colors.text }]}>Siguiente cobro</Text>
            <Text style={[s.cycleDays, { color: urgent ? colors.urgent : colors.text }]}>{relativeDayLabel(days)}</Text>
          </View>
          <View style={[s.cycleTrack, { backgroundColor: colors.separator }]}>
            <View style={[s.cycleFill, { width: `${Math.max(cycleProgress, 0.03) * 100}%`, backgroundColor: urgent ? colors.urgent : colors.ink }]} />
          </View>
          <Text style={[s.cycleFoot, { color: colors.subtext }]}>
            {next.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* Cifras clave */}
        <View style={s.insights}>
          {[
            { label: 'Al mes', value: moneyShort(monthly) },
            { label: 'Al año', value: moneyShort(annual) },
            { label: 'De tu gasto', value: `${Math.round(share * 100)}%` },
          ].map(it => (
            <View key={it.label} style={[s.insight, { backgroundColor: colors.surface }]}>
              <Text style={[s.insightValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{it.value}</Text>
              <Text style={[s.insightLabel, { color: colors.subtext }]}>{it.label}</Text>
            </View>
          ))}
        </View>
        {paidApprox > 0 && (
          <Text style={[s.paid, { color: colors.subtext }]}>
            Llevas aprox. <Text style={{ color: colors.text, fontWeight: '900' }}>{moneyShort(paidApprox)}</Text> pagados desde que la agregaste.
          </Text>
        )}

        {/* Detalles */}
        <Text style={[s.section, { color: colors.text }]}>Detalles</Text>
        <View style={[s.list, { backgroundColor: colors.surface }]}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
              <View style={[s.rowIcon, { backgroundColor: row.tint === colors.urgent ? colors.urgentSoft : colors.bg }]}>
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
                  ? <Text style={[s.clabe, { color: colors.text }]}>{linkedCard.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</Text>
                  : <Text style={{ color: colors.subtext, fontWeight: '600' }}>{linkedCard.bank}</Text>}
              </View>
              {linkedCard.kind === 'clabe'
                ? <Ionicons name="copy-outline" size={20} color={colors.text} />
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

  cycle: { marginHorizontal: spacing.screen, marginTop: 14, borderRadius: radius.lg, padding: 18, gap: 12 },
  cycleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleDays: { fontSize: 15, fontWeight: '900' },
  cycleTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  cycleFill: { height: 8, borderRadius: 4 },
  cycleFoot: { fontSize: 13, fontWeight: '700' },

  insights: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 10 },
  insight: { flex: 1, borderRadius: radius.md, padding: 14, gap: 2 },
  insightLabel: { fontSize: 12, fontWeight: '700' },
  insightValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  paid: { fontSize: 13, fontWeight: '600', marginHorizontal: spacing.screen, marginTop: 12 },

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
