import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import { CardChip } from '../../src/components/CardPickerModal';
import { BrandIcon, getBrandIcon } from '../../src/utils/brandIcons';
import {
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '../../src/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function paymentIcon(method: PaymentMethod): IoniconName {
  const map: Record<PaymentMethod, IoniconName> = {
    credit_card: 'card-outline',
    debit_card: 'card',
    paypal: 'logo-paypal',
    bank_transfer: 'swap-horizontal-outline',
    cash: 'cash-outline',
    other: 'ellipsis-horizontal-outline',
  };
  return map[method] ?? 'card-outline';
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / 86400000);
}

function renewalLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days < 7) return `En ${days} días`;
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subscriptions, remove } = useSubscriptions();
  const { colors, dark } = useTheme();
  const { cards } = usePaymentCards();
  const router = useRouter();

  // Real-time from Firestore context — always up to date
  const sub = subscriptions.find(s => s.id === id) ?? null;
  const linkedCard = sub?.card_id ? (cards.find(c => c.id === sub.card_id) ?? null) : null;

  if (!sub) {
    return (
      <SafeAreaView edges={['bottom']} style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.subtext }}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = daysUntil(sub.next_renewal);
  const label = renewalLabel(sub.next_renewal);
  const isUrgent = days <= 7;
  const annualCost = sub.billing_cycle === 'yearly' ? sub.price : sub.price * 12;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar suscripción',
      `¿Eliminar ${sub.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await remove(sub);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={[s.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: sub.name }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Hero */}
        {(() => {
          const brandIcon = getBrandIcon('', sub.name);
          return (
            <View style={[s.hero, { backgroundColor: brandIcon ? `#${brandIcon.hex}18` : sub.color }]}>
              {brandIcon ? (
                <BrandIcon icon={brandIcon} size={72} />
              ) : (
                <Text style={s.heroLetter}>{sub.name[0].toUpperCase()}</Text>
              )}
              <Text style={[s.heroName, { color: brandIcon ? `#${brandIcon.hex}` : '#fff' }]}>
                {sub.name}
              </Text>
              <Text style={[s.heroCategory, { color: brandIcon ? `#${brandIcon.hex}99` : 'rgba(255,255,255,0.75)' }]}>
                {CATEGORY_LABELS[sub.category]}
              </Text>
            </View>
          );
        })()}

        {/* Summary cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[s.summaryValue, { color: colors.text }]}>${sub.price.toFixed(2)}</Text>
            <Text style={[s.summaryLabel, { color: colors.subtext }]}>
              {sub.billing_cycle === 'monthly' ? 'por mes' : 'por año'}
            </Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[s.summaryValue, { color: isUrgent ? colors.urgent : colors.accent }]}>{label}</Text>
            <Text style={[s.summaryLabel, { color: colors.subtext }]}>próximo cobro</Text>
          </View>
        </View>

        {/* Detail info cards — 2×2 grid */}
        <Text style={[s.sectionHeader, { color: colors.subtext }]}>Detalles</Text>
        <View style={s.infoGrid}>
          {/* Próximo cobro */}
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.infoIconWrap, { backgroundColor: isUrgent ? (dark ? '#4C0519' : '#FEF2F2') : (dark ? '#1E3A5F' : '#EFF6FF') }]}>
              <Ionicons name="calendar-outline" size={18} color={isUrgent ? colors.urgent : '#3B82F6'} />
            </View>
            <Text style={[s.infoLabel, { color: colors.subtext }]}>Próximo cobro</Text>
            <Text style={[s.infoValue, { color: isUrgent ? colors.urgent : colors.text }]}>{label}</Text>
            <View style={[s.infoPill, { backgroundColor: isUrgent ? (dark ? '#4C0519' : '#FEF2F2') : colors.accentSoft }]}>
              <Text style={[s.infoPillText, { color: isUrgent ? colors.urgent : colors.accent }]}>{sub.next_renewal}</Text>
            </View>
          </View>

          {/* Ciclo de cobro */}
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.infoIconWrap, {
              backgroundColor: sub.billing_cycle === 'monthly'
                ? (dark ? '#052E16' : '#F0FDF4')
                : (dark ? '#431407' : '#FFF7ED'),
            }]}>
              <Ionicons name="repeat-outline" size={18} color={sub.billing_cycle === 'monthly' ? '#16A34A' : '#EA580C'} />
            </View>
            <Text style={[s.infoLabel, { color: colors.subtext }]}>Ciclo</Text>
            <Text style={[s.infoValue, { color: colors.text }]}>
              {sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
            </Text>
            <View style={[s.infoPill, {
              backgroundColor: sub.billing_cycle === 'monthly'
                ? (dark ? '#052E16' : '#F0FDF4')
                : (dark ? '#431407' : '#FFF7ED'),
            }]}>
              <Text style={[s.infoPillText, { color: sub.billing_cycle === 'monthly' ? '#16A34A' : '#EA580C' }]}>
                {sub.billing_cycle === 'monthly' ? 'Cada mes' : 'Cada año'}
              </Text>
            </View>
          </View>

          {/* Método de pago */}
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.infoIconWrap, { backgroundColor: dark ? '#2E1065' : '#F5F3FF' }]}>
              <Ionicons name={paymentIcon(sub.payment_method)} size={18} color="#7C3AED" />
            </View>
            <Text style={[s.infoLabel, { color: colors.subtext }]}>Pago</Text>
            <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={1}>
              {PAYMENT_METHOD_LABELS[sub.payment_method] ?? 'Otro'}
            </Text>
          </View>

          {/* Recordatorio */}
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.infoIconWrap, {
              backgroundColor: sub.remind_me
                ? (dark ? '#422006' : '#FEF9C3')
                : (dark ? '#1E293B' : '#F1F5F9'),
            }]}>
              <Ionicons
                name={sub.remind_me ? 'notifications' : 'notifications-off-outline'}
                size={18}
                color={sub.remind_me ? '#CA8A04' : colors.subtext}
              />
            </View>
            <Text style={[s.infoLabel, { color: colors.subtext }]}>Recordatorio</Text>
            <View style={[s.infoPill, {
              backgroundColor: sub.remind_me
                ? (dark ? '#422006' : '#FEF9C3')
                : (dark ? '#1E293B' : '#F1F5F9'),
            }]}>
              <Text style={[s.infoPillText, { color: sub.remind_me ? '#CA8A04' : colors.subtext }]}>
                {sub.remind_me ? '1 día antes' : 'Desactivado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Fecha de alta — full width info card */}
        <View style={[s.infoCardWide, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[s.infoIconWrap, { backgroundColor: dark ? '#052E16' : '#F0FDF4' }]}>
            <Ionicons name="time-outline" size={18} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoLabel, { color: colors.subtext }]}>Agregada el</Text>
            <Text style={[s.infoValue, { color: colors.text }]}>
              {new Date(sub.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
        </View>

        {/* Linked card */}
        {linkedCard && (
          <>
            <Text style={[s.sectionHeader, { color: colors.subtext }]}>Tarjeta / CLABE</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {linkedCard.kind === 'clabe' && linkedCard.clabe ? (
                /* CLABE: show alias + full number + copy button in one clean row */
                <TouchableOpacity
                  style={[s.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 16 }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(linkedCard.clabe!);
                    if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
                    else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[s.clabeIcon, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="swap-horizontal-outline" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowLabel, { color: colors.text }]}>{linkedCard.alias}</Text>
                    <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 1 }}>{linkedCard.bank}</Text>
                    <Text style={[s.clabeNumber, { color: colors.accent }]}>
                      {linkedCard.clabe!.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    </Text>
                  </View>
                  <View style={[s.copyBtn, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="copy-outline" size={14} color={colors.accent} />
                    <Text style={[s.copyText, { color: colors.accent }]}>Copiar</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Card: show chip with brand + digits */
                <View style={[s.row, { gap: 12 }]}>
                  <Ionicons name="card-outline" size={18} color={colors.subtext} style={s.rowIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowLabel, { color: colors.text }]}>{linkedCard.alias}</Text>
                    <Text style={{ fontSize: 13, color: colors.subtext, marginTop: 2 }}>{linkedCard.bank}</Text>
                  </View>
                  <CardChip card={linkedCard} colors={colors} />
                </View>
              )}
            </View>
          </>
        )}

        {/* Notes */}
        {!!sub.description && (
          <>
            <Text style={[s.sectionHeader, { color: colors.subtext }]}>Notas</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[s.row, { alignItems: 'flex-start' }]}>
                <Ionicons name="document-text-outline" size={18} color={colors.subtext} style={s.rowIcon} />
                <Text style={[s.rowLabel, { color: colors.text, lineHeight: 22 }]}>{sub.description}</Text>
              </View>
            </View>
          </>
        )}

        {/* Annual projection */}
        <View style={[s.projCard, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
          <View style={[s.projIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="trending-up-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.projTitle, { color: colors.subtext }]}>Gasto anual estimado</Text>
            <Text style={[s.projAmount, { color: colors.accent }]}>${annualCost.toFixed(2)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/subscription/new?id=${sub.id}`)}
            activeOpacity={0.8}
          >
            <View style={s.actionCardIcon}>
              <Ionicons name="pencil-outline" size={20} color={colors.primaryText} />
            </View>
            <Text style={[s.actionCardLabel, { color: colors.primaryText }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.urgent }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <View style={[s.actionCardIcon, { backgroundColor: '#FEF2F222' }]}>
              <Ionicons name="trash-outline" size={20} color={colors.urgent} />
            </View>
            <Text style={[s.actionCardLabel, { color: colors.urgent }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: { margin: 16, borderRadius: 24, paddingVertical: 36, alignItems: 'center', gap: 6 },
  heroLetter: { fontSize: 60, fontWeight: '800', color: '#fff', lineHeight: 68 },
  heroName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  heroCategory: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  summaryRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 13 },
  sectionHeader: { fontSize: 15, fontWeight: '700', marginHorizontal: 16, marginTop: 24, marginBottom: 10 },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 15 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 46 },

  // Info cards grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10 },
  infoCard: {
    width: '47.5%', borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoCardWide: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10,
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  infoValue: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  infoPill: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  infoPillText: { fontSize: 10, fontWeight: '600' },

  projCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 14 },
  projIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  projTitle: { fontSize: 13 },
  projAmount: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  clabeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clabeNumber: { fontSize: 14, fontWeight: '600', letterSpacing: 1.5, marginTop: 6 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  copyText: { fontSize: 13, fontWeight: '600' },

  // Action buttons (card-style)
  actionsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 24, gap: 12 },
  actionCard: {
    flex: 1, borderRadius: 18, padding: 18, alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  actionCardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionCardLabel: { fontSize: 15, fontWeight: '700' },
});
