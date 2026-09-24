import React, { useEffect, useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useCancelNotification, useScheduleNotification } from '../../src/hooks/useNotifications';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import CardPickerModal, { CardChip, cardLabel } from '../../src/components/CardPickerModal';
import { SubIcon } from '../../src/utils/brandIcons';
import type { PaymentCard } from '../../src/types';
import {
  CATEGORY_LABELS,
  type BillingCycle,
  type Category,
  type PaymentMethod,
} from '../../src/types';
import { PREDEFINED_SUBSCRIPTIONS, type ServiceCategory } from '../../constants/subscriptions';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];
const COLORS = ['#E50914', '#1DB954', '#3478F6', '#FF9500', '#AF52DE', '#34C759', '#FF3B30', '#007AFF'];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: IoniconName }[] = [
  { key: 'credit_card',   label: 'Tarjeta crédito',  icon: 'card-outline' },
  { key: 'debit_card',    label: 'Tarjeta débito',    icon: 'card' },
  { key: 'paypal',        label: 'PayPal',             icon: 'logo-paypal' },
  { key: 'bank_transfer', label: 'Transferencia',     icon: 'swap-horizontal-outline' },
  { key: 'cash',          label: 'Efectivo',           icon: 'cash-outline' },
  { key: 'other',         label: 'Otro',               icon: 'ellipsis-horizontal-outline' },
];

function defaultRenewal() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function mapCategory(cat: ServiceCategory): Category {
  const m: Record<ServiceCategory, Category> = {
    Streaming: 'entertainment', Música: 'entertainment',
    Almacenamiento: 'productivity', Productividad: 'productivity',
    Gaming: 'entertainment', IA: 'productivity', Educación: 'education',
  };
  return m[cat] ?? 'other';
}

function formatMXN(n: number): string {
  return `$${n.toLocaleString('es-MX')} MXN`;
}

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const {
    id,
    catalogId,
    planName,
    planPrice,
    planPeriod,
    custom,
  } = useLocalSearchParams<{
    id?: string;
    catalogId?: string;
    planName?: string;
    planPrice?: string;
    planPeriod?: string;
    custom?: string;
  }>();
  const isEdit = !!id;
  // If catalogId + plan params → skip catalog, go straight to form pre-filled
  // If custom=true → go straight to empty form
  // Otherwise → show catalog first (no params)
  const hasCatalogPrefill = !!catalogId && !!planPrice;
  const goDirectToForm = isEdit || hasCatalogPrefill || custom === 'true';

  const { subscriptions, add, update, setNotifId } = useSubscriptions();
  const scheduleNotif = useScheduleNotification();
  const cancelNotif   = useCancelNotification();
  const { colors } = useTheme();

  const existingSub = id ? subscriptions.find(s => s.id === id) : null;
  const catalogSub = catalogId ? PREDEFINED_SUBSCRIPTIONS.find(s => s.id === catalogId) : null;

  // screen mode: 'catalog' | 'form'
  const [mode, setMode] = useState<'catalog' | 'form'>(goDirectToForm ? 'form' : 'catalog');

  const [initialized, setInitialized] = useState(false);
  const [name,          setName]          = useState('');
  const [price,         setPrice]         = useState('');
  const [billing,       setBilling]       = useState<BillingCycle>('monthly');
  const [renewal,       setRenewal]       = useState(defaultRenewal());
  const [category,      setCategory]      = useState<Category>('entertainment');
  const [color,         setColor]         = useState(COLORS[0]);
  const [remind,        setRemind]        = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [description,   setDescription]   = useState('');
  const [selectedCard,  setSelectedCard]  = useState<PaymentCard | null>(null);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { cards } = usePaymentCards();
  const [saving,        setSaving]        = useState(false);

  const renewalDate = new Date(renewal + 'T12:00:00');
  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setRenewal(`${y}-${m}-${d}`);
    }
  };
  const renewalDisplay = renewalDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  // Pre-fill form from existing subscription (edit mode) or catalog params
  useEffect(() => {
    if (initialized) return;
    if (existingSub) {
      setName(existingSub.name);
      setPrice(String(existingSub.price));
      setBilling(existingSub.billing_cycle);
      setRenewal(existingSub.next_renewal);
      setCategory(existingSub.category);
      setColor(existingSub.color);
      setRemind(existingSub.remind_me === 1);
      setPaymentMethod(existingSub.payment_method);
      setDescription(existingSub.description ?? '');
      if (existingSub.card_id) {
        const linked = cards.find(c => c.id === existingSub.card_id) ?? null;
        setSelectedCard(linked);
      }
      setInitialized(true);
    } else if (hasCatalogPrefill && catalogSub) {
      setName(catalogSub.nombre);
      setPrice(planPrice!);
      setBilling(planPeriod === 'anual' ? 'yearly' : 'monthly');
      setColor(catalogSub.color);
      setCategory(mapCategory(catalogSub.categoria));
      setInitialized(true);
    } else if (!isEdit) {
      setInitialized(true);
    }
  }, [existingSub, initialized, hasCatalogPrefill, catalogSub, planPrice, planPeriod, isEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresa el nombre del servicio.');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio mayor a 0.');
      return;
    }

    setSaving(true);
    const data = {
      name: name.trim(), price: priceNum, billing_cycle: billing,
      next_renewal: renewal, category, color,
      remind_me: remind ? 1 : 0 as 0 | 1,
      payment_method: paymentMethod,
      description: description.trim() || undefined,
      card_id: selectedCard?.id ?? undefined,
    };

    if (isEdit && id) {
      await update(id, data);
      // Handle notifications for edit
      if (existingSub?.notification_id) await cancelNotif(existingSub.notification_id);
      if (remind) {
        const notifId = await scheduleNotif(data);
        await setNotifId(id, notifId);
      } else {
        await setNotifId(id, null);
      }
    } else {
      await add(data);
    }

    setSaving(false);
    router.back();
  };

  // ── Catalog mode ─────────────────────────────────────────────────────────────
  if (mode === 'catalog') {
    return (
      <>
        <Stack.Screen options={{ title: 'Nueva suscripción' }} />
        <CatalogPicker
          colors={colors}
          onSelectPlan={(sub, plan) => {
            setName(sub.nombre);
            setPrice(String(plan.precioMensual));
            setBilling(plan.periodo === 'anual' ? 'yearly' : 'monthly');
            setColor(sub.color);
            setCategory(mapCategory(sub.categoria));
            setInitialized(true);
            setMode('form');
          }}
          onCustom={() => {
            setInitialized(true);
            setMode('form');
          }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? 'Editar suscripción' : 'Nueva suscripción' }} />
      <ScrollView
        style={[s.root, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 52 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Live preview card ── */}
        <View style={[s.previewCard, { backgroundColor: color + '18', borderColor: color + '35' }]}>
          {name ? (
            <SubIcon name={name} color={color} size={56} borderRadius={16} />
          ) : (
            <View style={[s.previewPlaceholder, { backgroundColor: color, borderRadius: 16 }]}>
              <Ionicons name="add" size={26} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          <View style={s.previewContent}>
            <Text style={[s.previewName, { color: colors.text }]} numberOfLines={1}>
              {name || 'Nombre del servicio'}
            </Text>
            <Text style={[s.previewPrice, { color: color }]}>
              {price ? `$${price}` : '$0.00'}
              <Text style={[s.previewCycle, { color: colors.subtext }]}>
                {billing === 'monthly' ? ' / mes' : ' / año'}
              </Text>
            </Text>
          </View>
          <View style={[s.previewBadge, { backgroundColor: color + '25' }]}>
            <Text style={[s.previewBadgeText, { color: color }]}>
              {billing === 'monthly' ? 'Mensual' : 'Anual'}
            </Text>
          </View>
        </View>

        {/* ── Servicio ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Servicio</Text>
        <View style={[s.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Name input */}
          <View style={[s.fieldRow, { borderBottomColor: colors.separator }]}>
            <View style={[s.fieldIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name="apps-outline" size={17} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldMicro, { color: colors.subtext }]}>Nombre</Text>
              <TextInput
                placeholder="Netflix, Spotify, etc."
                placeholderTextColor={colors.subtext}
                value={name}
                onChangeText={setName}
                style={[s.fieldInput, { color: colors.text }]}
              />
            </View>
          </View>
          {/* Color swatch picker */}
          <View style={s.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, color === c && s.colorSelected]}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={13} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Precio y ciclo ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Precio y ciclo</Text>
        <View style={[s.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={s.priceRow}>
            <View style={[s.fieldIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cash-outline" size={17} color="#16A34A" />
            </View>
            <Text style={[s.dollar, { color: colors.subtext }]}>$</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={colors.subtext}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={[s.priceInput, { color: colors.text }]}
            />
            <View style={[s.billingToggle, { backgroundColor: colors.bg }]}>
              {(['monthly', 'yearly'] as BillingCycle[]).map(b => (
                <TouchableOpacity
                  key={b}
                  style={[s.billingOption, billing === b && { backgroundColor: colors.primary }]}
                  onPress={() => setBilling(b)}
                >
                  <Text style={[s.billingLabel, { color: billing === b ? colors.primaryText : colors.subtext }]}>
                    {b === 'monthly' ? 'Mes' : 'Año'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Próximo cobro ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Próximo cobro</Text>
        <TouchableOpacity
          style={[s.fieldCard, s.dateCardRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setShowDatePicker(v => !v)}
          activeOpacity={0.75}
        >
          <View style={[s.fieldIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar-outline" size={17} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldMicro, { color: colors.subtext }]}>Fecha de renovación</Text>
            <Text style={[s.fieldInput, { color: colors.text }]}>{renewalDisplay}</Text>
          </View>
          <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-forward'} size={16} color={colors.subtext} />
        </TouchableOpacity>
        {showDatePicker && (
          <View style={[s.datePickerWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <DateTimePicker
              value={renewalDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              locale="es-MX"
              style={{ width: '100%' }}
              themeVariant="light"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={s.pickerDone} onPress={() => setShowDatePicker(false)}>
                <Text style={[s.pickerDoneText, { color: colors.primary }]}>Listo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Categoría ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.catChip, {
                backgroundColor: category === key ? colors.primary : colors.card,
                borderColor: category === key ? colors.primary : colors.cardBorder,
              }]}
              onPress={() => setCategory(key)}
            >
              <Text style={[s.catChipLabel, { color: category === key ? colors.primaryText : colors.subtext }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Recordatorio ── */}
        <View style={[s.toggleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[s.fieldIcon, { backgroundColor: '#FEF9C3' }]}>
            <Ionicons name="notifications-outline" size={18} color="#CA8A04" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.toggleTitle, { color: colors.text }]}>Recordatorio</Text>
            <Text style={[s.toggleSub, { color: colors.subtext }]}>Un día antes del cobro</Text>
          </View>
          <Switch
            value={remind}
            onValueChange={setRemind}
            trackColor={{ false: colors.separator, true: '#34C759' }}
            thumbColor="#fff"
            ios_backgroundColor={colors.separator}
          />
        </View>

        {/* ── Método de pago ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Método de pago</Text>
        <View style={s.pmGrid}>
          {PAYMENT_METHODS.map(pm => {
            const active = paymentMethod === pm.key;
            return (
              <TouchableOpacity
                key={pm.key}
                style={[s.pmCard, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.cardBorder,
                }]}
                onPress={() => setPaymentMethod(pm.key)}
                activeOpacity={0.75}
              >
                <Ionicons name={pm.icon} size={19} color={active ? colors.primaryText : colors.subtext} />
                <Text style={[s.pmLabel, { color: active ? colors.primaryText : colors.text }]} numberOfLines={1}>
                  {pm.label}
                </Text>
                {active && (
                  <View style={s.pmCheck}>
                    <Ionicons name="checkmark" size={10} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tarjeta / CLABE ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Tarjeta asociada</Text>
        <TouchableOpacity
          style={[s.fieldCard, s.dateCardRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setShowCardPicker(true)}
          activeOpacity={0.75}
        >
          <View style={[s.fieldIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="card-outline" size={17} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldMicro, { color: colors.subtext }]}>Tarjeta de cobro</Text>
            {selectedCard
              ? <CardChip card={selectedCard} colors={colors} />
              : <Text style={[s.fieldInput, { color: colors.subtext }]}>Sin tarjeta seleccionada</Text>
            }
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
        </TouchableOpacity>

        <CardPickerModal
          visible={showCardPicker}
          selectedCardId={selectedCard?.id}
          onSelect={c => setSelectedCard(c)}
          onClose={() => setShowCardPicker(false)}
        />

        {/* ── Notas ── */}
        <Text style={[s.sectionLabel, { color: colors.subtext }]}>Notas</Text>
        <View style={[s.fieldCard, s.notesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document-text-outline" size={17} color={colors.subtext} style={{ marginBottom: 8 }} />
          <TextInput
            placeholder="Cuenta compartida, usuarios, detalles adicionales…"
            placeholderTextColor={colors.subtext}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[s.notesInput, { color: colors.text }]}
          />
        </View>

        {/* ── Guardar ── */}
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={22} color={colors.primaryText} />
          <Text style={[s.saveBtnLabel, { color: colors.primaryText }]}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar suscripción'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Live preview card
  previewCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16,
    borderRadius: 22, borderWidth: 1.5, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  previewPlaceholder: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  previewContent: { flex: 1 },
  previewName: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  previewPrice: { fontSize: 22, fontWeight: '800' },
  previewCycle: { fontSize: 13, fontWeight: '400' },
  previewBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  previewBadgeText: { fontSize: 11, fontWeight: '700' },

  // Section labels
  sectionLabel: {
    fontSize: 13, fontWeight: '700',
    marginHorizontal: 20, marginTop: 22, marginBottom: 8,
  },

  // Generic field card
  fieldCard: {
    marginHorizontal: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  fieldMicro: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  fieldInput: { fontSize: 15, fontWeight: '600', padding: 0 },

  // Color picker (inside service card)
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14, paddingTop: 10 },
  colorDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  colorSelected: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  // Price row
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  dollar: { fontSize: 20, fontWeight: '600' },
  priceInput: { flex: 1, fontSize: 28, fontWeight: '800', padding: 0 },
  billingToggle: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2 },
  billingOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  billingLabel: { fontSize: 13, fontWeight: '700' },

  // Date card
  dateCardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  datePickerWrap: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    paddingHorizontal: 8, paddingBottom: 8,
  },
  pickerDone: { alignItems: 'flex-end', paddingRight: 12, paddingBottom: 4 },
  pickerDoneText: { fontSize: 16, fontWeight: '600' },

  // Category chips
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  catChipLabel: { fontSize: 13, fontWeight: '600' },

  // Reminder toggle card
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10,
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  toggleTitle: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2 },

  // Payment method grid
  pmGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10 },
  pmCard: {
    width: '47.5%', flexGrow: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  pmLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  pmCheck: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },

  // Notes
  notesCard: { paddingHorizontal: 14, paddingVertical: 14 },
  notesInput: { fontSize: 15, minHeight: 72, textAlignVertical: 'top', lineHeight: 22 },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 32, borderRadius: 20, paddingVertical: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  saveBtnLabel: { fontSize: 17, fontWeight: '700' },
});

// ── Catalog picker component (inline, used in form modal) ──────────────────────

import { Dimensions, FlatList } from 'react-native';
import { ALL_CATEGORIES, type Plan, type PredefinedSubscription } from '../../constants/subscriptions';

const GRID_W = (Dimensions.get('window').width - 16 * 2 - 10) / 2;

function CatalogPicker({
  colors,
  onSelectPlan,
  onCustom,
}: {
  colors: ReturnType<typeof import('../../src/hooks/useTheme').useTheme>['colors'];
  onSelectPlan: (sub: PredefinedSubscription, plan: Plan) => void;
  onCustom: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedSub, setSelectedSub] = useState<PredefinedSubscription | null>(null);

  const filtered = React.useMemo(() => {
    let subs = PREDEFINED_SUBSCRIPTIONS;
    if (activeCategory !== 'Todos') subs = subs.filter(s => s.categoria === activeCategory);
    if (query.trim()) subs = subs.filter(s => s.nombre.toLowerCase().includes(query.toLowerCase()));
    return subs;
  }, [query, activeCategory]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Custom option banner */}
      <TouchableOpacity
        style={[cp.customBanner, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}
        onPress={onCustom}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[cp.customTitle, { color: colors.text }]}>Agregar personalizada</Text>
          <Text style={[cp.customSub, { color: colors.subtext }]}>Cualquier servicio con precio libre</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
      </TouchableOpacity>

      {/* Search */}
      <View style={[cp.search, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="search" size={15} color={colors.subtext} />
        <TextInput
          value={query} onChangeText={setQuery}
          placeholder="Buscar…" placeholderTextColor={colors.subtext}
          style={[cp.searchInput, { color: colors.text }]}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={15} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cp.chips}>
        {(['Todos', ...ALL_CATEGORIES] as string[]).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[cp.chip, { backgroundColor: activeCategory === cat ? colors.primary : colors.card, borderColor: activeCategory === cat ? colors.primary : colors.cardBorder }]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[cp.chipText, { color: activeCategory === cat ? colors.primaryText : colors.subtext }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const minPrice = Math.min(...item.planes.map(p => p.precioMensual));
          const isSelected = selectedSub?.id === item.id;
          return (
            <TouchableOpacity
              style={[cp.card, { backgroundColor: colors.card, borderColor: isSelected ? item.color : colors.cardBorder, borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth }]}
              onPress={() => setSelectedSub(isSelected ? null : item)}
              activeOpacity={0.75}
            >
              <Text style={cp.emoji}>{item.icono}</Text>
              <Text style={[cp.cardName, { color: colors.text }]} numberOfLines={1}>{item.nombre}</Text>
              <Text style={[cp.cardPrice, { color: colors.subtext }]}>desde ${minPrice.toLocaleString('es-MX')}/mes</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Plan picker panel */}
      {selectedSub && (
        <View style={[cp.panel, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={cp.panelHandle} />
          <View style={cp.panelHeader}>
            <Text style={cp.panelEmoji}>{selectedSub.icono}</Text>
            <Text style={[cp.panelName, { color: colors.text }]}>{selectedSub.nombre}</Text>
            <TouchableOpacity onPress={() => setSelectedSub(null)}>
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>
          <Text style={[cp.planLabel, { color: colors.subtext }]}>Elige un plan</Text>
          {selectedSub.planes.map((plan, i) => (
            <TouchableOpacity
              key={i}
              style={[cp.planRow, { borderColor: colors.separator }]}
              onPress={() => onSelectPlan(selectedSub, plan)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[cp.planName, { color: colors.text }]}>{plan.nombre}</Text>
                <Text style={[cp.planDesc, { color: colors.subtext }]}>{plan.descripcion}</Text>
                {plan.periodo === 'anual' && (
                  <Text style={cp.planAnnual}>Pago anual · ${plan.precio.toLocaleString('es-MX')} MXN/año</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[cp.planPrice, { color: colors.text }]}>${plan.precioMensual.toLocaleString('es-MX')}</Text>
                <Text style={[cp.planMxn, { color: colors.subtext }]}>MXN/mes</Text>
              </View>
              <View style={[cp.planArrow, { backgroundColor: selectedSub.color }]}>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const cp = StyleSheet.create({
  customBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  customTitle: { fontSize: 15, fontWeight: '600' },
  customSub: { fontSize: 12, marginTop: 1 },
  search: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { paddingHorizontal: 16, gap: 7, marginBottom: 12 },
  chip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 12, fontWeight: '500' },
  card: { width: GRID_W, borderRadius: 14, padding: 12, gap: 5 },
  emoji: { fontSize: 26, marginBottom: 2 },
  cardName: { fontSize: 14, fontWeight: '700' },
  cardPrice: { fontSize: 11 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20 },
  panelHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#8888', alignSelf: 'center', marginBottom: 14 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  panelEmoji: { fontSize: 24 },
  panelName: { flex: 1, fontSize: 18, fontWeight: '700' },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  planName: { fontSize: 15, fontWeight: '600' },
  planDesc: { fontSize: 12, marginTop: 2 },
  planAnnual: { fontSize: 11, color: '#34C759', fontWeight: '600', marginTop: 3 },
  planPrice: { fontSize: 17, fontWeight: '700' },
  planMxn: { fontSize: 11 },
  planArrow: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
