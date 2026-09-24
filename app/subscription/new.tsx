import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch,
  Text, TextInput, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useCancelNotification, useScheduleNotification } from '../../src/hooks/useNotifications';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import CardPickerModal, { CardChip } from '../../src/components/CardPickerModal';
import CatalogBrowser from '../../src/components/CatalogBrowser';
import {
  FilterPills, GradientButton, PressableScale, ScreenBackground, StackHeader, useStackHeaderSpace, type IoniconName,
} from '../../src/components/ui';
import { impactHaptic, successHaptic } from '../../src/theme/motion';
import { SubIcon } from '../../src/utils/brandIcons';
import { longDate, parseDate, toDateStr } from '../../src/utils/dates';
import { money } from '../../src/utils/format';
import { mapCategory, planPrice } from '../../src/utils/catalog';
import { identityColors, identityIcons, radius, spacing, type } from '../../src/theme/tokens';
import {
  CATEGORY_LABELS, type BillingCycle, type Category, type PaymentCard, type PaymentMethod,
} from '../../src/types';
import { PREDEFINED_SUBSCRIPTIONS } from '../../constants/subscriptions';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: IoniconName }[] = [
  { key: 'credit_card',   label: 'Tarjeta de crédito', icon: 'card-outline' },
  { key: 'debit_card',    label: 'Tarjeta de débito',  icon: 'card' },
  { key: 'paypal',        label: 'PayPal',             icon: 'logo-paypal' },
  { key: 'bank_transfer', label: 'Transferencia',      icon: 'swap-horizontal-outline' },
  { key: 'cash',          label: 'Efectivo',           icon: 'cash-outline' },
  { key: 'other',         label: 'Otro',               icon: 'ellipsis-horizontal' },
];

function defaultRenewal() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return toDateStr(d);
}

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerSpace = useStackHeaderSpace();
  const { id, catalogId, planPrice: planPriceParam, planPeriod, custom } = useLocalSearchParams<{
    id?: string; catalogId?: string; planName?: string; planPrice?: string; planPeriod?: string; custom?: string;
  }>();
  const isEdit = !!id;
  // catalogId + plan → formulario prellenado · custom=true → formulario vacío · sin params → catálogo primero
  const hasCatalogPrefill = !!catalogId && !!planPriceParam;
  const goDirectToForm = isEdit || hasCatalogPrefill || custom === 'true';

  const { subscriptions, add, update, setNotifId } = useSubscriptions();
  const scheduleNotif = useScheduleNotification();
  const cancelNotif = useCancelNotification();
  const { colors, dark } = useTheme();
  const { cards } = usePaymentCards();

  const existingSub = id ? subscriptions.find(s => s.id === id) : null;
  const catalogSub = catalogId ? PREDEFINED_SUBSCRIPTIONS.find(s => s.id === catalogId) : null;

  const [mode, setMode] = useState<'catalog' | 'form'>(goDirectToForm ? 'form' : 'catalog');
  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [renewal, setRenewal] = useState(defaultRenewal());
  const [category, setCategory] = useState<Category>('entertainment');
  const [color, setColor] = useState<string>(identityColors[0]);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [remind, setRemind] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [description, setDescription] = useState('');
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const renewalDate = parseDate(renewal);

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setRenewal(toDateStr(selected));
  };

  // Prellenado (edición o catálogo)
  useEffect(() => {
    if (initialized) return;
    if (existingSub) {
      setName(existingSub.name);
      setPrice(String(existingSub.price));
      setBilling(existingSub.billing_cycle);
      setRenewal(existingSub.next_renewal);
      setCategory(existingSub.category);
      setColor(existingSub.color);
      setIcon(existingSub.icon);
      setRemind(existingSub.remind_me === 1);
      setPaymentMethod(existingSub.payment_method);
      setDescription(existingSub.description ?? '');
      if (existingSub.card_id) setSelectedCard(cards.find(c => c.id === existingSub.card_id) ?? null);
      setInitialized(true);
    } else if (hasCatalogPrefill && catalogSub) {
      setName(catalogSub.nombre);
      setPrice(planPriceParam!);
      setBilling(planPeriod === 'anual' ? 'yearly' : 'monthly');
      setColor(catalogSub.color);
      setCategory(mapCategory(catalogSub.categoria));
      setInitialized(true);
    } else if (!isEdit) {
      setInitialized(true);
    }
  }, [existingSub, initialized, hasCatalogPrefill, catalogSub, planPriceParam, planPeriod, isEdit, cards]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresa el nombre del servicio.');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio mayor a 0.');
      return;
    }

    setSaving(true);
    impactHaptic();
    try {
      const data = {
        name: name.trim(), price: priceNum, billing_cycle: billing,
        next_renewal: renewal, category, color, icon,
        remind_me: remind ? 1 : 0,
        payment_method: paymentMethod,
        description: description.trim() || undefined,
        card_id: selectedCard?.id ?? undefined,
      };

      if (isEdit && id) {
        await update(id, data);
        if (existingSub?.notification_id) await cancelNotif(existingSub.notification_id);
        await setNotifId(id, remind ? await scheduleNotif(data) : null);
      } else {
        await add(data);
      }
      successHaptic();
      router.back();
    } catch (e) {
      Alert.alert('No se pudo guardar', 'Revisa tu conexión e inténtalo de nuevo.');
      console.warn(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Paso 1: catálogo ──────────────────────────────────────────────────────
  if (mode === 'catalog') {
    return (
      <View style={{ flex: 1 }}>
        <CatalogBrowser
          bottomInset={insets.bottom + 24}
          header={
            <PressableScale onPress={() => { setInitialized(true); setMode('form'); }} style={s.customWrap}>
              <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.custom}>
                <View style={[s.customIcon, { borderColor: colors.onInk }]}><Ionicons name="create-outline" size={22} color={colors.onInk} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.customTitle, { color: colors.onInk }]}>Personalizada</Text>
                  <Text style={[s.customSub, { color: colors.onInk }]}>Cualquier servicio, precio libre</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={colors.onInk} />
              </LinearGradient>
            </PressableScale>
          }
          onSelectPlan={(sub, plan) => {
            setName(sub.nombre);
            setPrice(String(planPrice(plan)));
            setBilling(plan.periodo === 'anual' ? 'yearly' : 'monthly');
            setColor(sub.color);
            setCategory(mapCategory(sub.categoria));
            setInitialized(true);
            setMode('form');
          }}
        />
        <StackHeader title="Nueva suscripción" onBack={() => router.back()} />
      </View>
    );
  }

  // ── Paso 2: formulario ────────────────────────────────────────────────────
  const priceNum = parseFloat(price.replace(',', '.')) || 0;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground scene="neutral" tint={color} />
      <StackHeader title={isEdit ? 'Editar suscripción' : 'Nueva suscripción'} onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: headerSpace, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vista previa en vivo */}
          <View style={[s.preview, { backgroundColor: colors.surface }]}>
            <SubIcon name={name || '?'} color={color} icon={icon} size={64} borderRadius={32} />
            <View style={{ flex: 1 }}>
              <Text style={[s.previewName, { color: colors.text }]} numberOfLines={1}>{name || 'Nombre del servicio'}</Text>
              <Text style={[s.previewPrice, { color: colors.text }]}>
                {money(priceNum)}
                <Text style={[s.previewCycle, { color: colors.subtext }]}>{billing === 'monthly' ? ' /mes' : ' /año'}</Text>
              </Text>
              {billing === 'yearly' && priceNum > 0 && (
                <Text style={[s.previewHint, { color: colors.success }]}>≈ {money(priceNum / 12)} al mes</Text>
              )}
            </View>
          </View>

          {/* Nombre */}
          <Label text="Servicio" />
          <View style={[s.field, { backgroundColor: colors.surface }]}>
            <Ionicons name="apps-outline" size={20} color={colors.subtext} />
            <TextInput
              placeholder="Netflix, Spotify, gimnasio…"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={[s.input, { color: colors.text }]}
            />
          </View>

          {/* Precio + ciclo */}
          <Label text="Precio y ciclo" />
          <View style={[s.priceCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.dollar, { color: colors.subtext }]}>$</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={[s.priceInput, { color: colors.text }]}
            />
            <Text style={[s.mxn, { color: colors.subtext }]}>MXN</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <FilterPills<BillingCycle>
              scroll={false}
              value={billing}
              onChange={setBilling}
              options={[{ key: 'monthly', label: 'Mensual' }, { key: 'yearly', label: 'Anual' }]}
            />
          </View>

          {/* Fecha */}
          <Label text="Próximo cobro" />
          <Pressable onPress={() => setShowDatePicker(v => !v)} style={[s.field, { backgroundColor: colors.surface }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
            <Text style={[s.input, { color: colors.text }]}>{longDate(renewalDate)}</Text>
            <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.subtext} />
          </Pressable>
          {showDatePicker && (
            <View style={[s.picker, { backgroundColor: colors.surface }]}>
              <DateTimePicker
                value={renewalDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
                locale="es-MX"
                accentColor={colors.accent}
                themeVariant={dark ? 'dark' : 'light'}
              />
              {Platform.OS === 'ios' && (
                <Pressable style={s.pickerDone} onPress={() => setShowDatePicker(false)}>
                  <Text style={[type.bodyBold, { color: colors.accent }]}>Listo</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Categoría */}
          <Label text="Categoría" />
          <FilterPills<Category>
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(([key, label]) => ({ key, label }))}
          />

          {/* Ícono */}
          <Label text="Ícono" hint="Se usa si el servicio no tiene logo reconocido" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.iconsRow}>
            {identityIcons.map(ic => {
              const active = icon === ic;
              return (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(active ? undefined : ic)}
                  accessibilityLabel={`Ícono ${ic}`}
                  style={[s.iconSwatch, { backgroundColor: active ? color : colors.surface }]}
                >
                  <Ionicons name={ic as IoniconName} size={20} color={active ? '#fff' : colors.subtext} />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Color */}
          <Label text="Color" />
          <View style={s.colors}>
            {identityColors.map(c => (
              <Pressable key={c} onPress={() => setColor(c)} accessibilityLabel={`Color ${c}`}
                style={[s.swatch, { backgroundColor: c }, color === c && { borderColor: colors.text, transform: [{ scale: 1.12 }] }]}>
                {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
              </Pressable>
            ))}
          </View>

          {/* Recordatorio */}
          <View style={[s.toggle, { backgroundColor: colors.surface }]}>
            <View style={[s.toggleIcon, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="notifications" size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.bodyBold, { color: colors.text }]}>Recordatorio</Text>
              <Text style={[s.toggleSub, { color: colors.subtext }]}>Te avisamos un día antes a las 9:00</Text>
            </View>
            <Switch value={remind} onValueChange={setRemind} trackColor={{ false: colors.separator, true: colors.ink }} thumbColor={colors.bg} ios_backgroundColor={colors.separator} />
          </View>

          {/* Método de pago */}
          <Label text="Método de pago" />
          <View style={s.pmGrid}>
            {PAYMENT_METHODS.map(pm => {
              const active = paymentMethod === pm.key;
              return (
                <PressableScale key={pm.key} onPress={() => setPaymentMethod(pm.key)} style={s.pmCell}>
                  <View style={[s.pm, active ? { backgroundColor: colors.ink } : { backgroundColor: colors.surface }]}>
                    <Ionicons name={pm.icon} size={18} color={active ? colors.onInk : colors.subtext} />
                    <Text style={[s.pmLabel, { color: active ? colors.onInk : colors.text }]} numberOfLines={2}>{pm.label}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {/* Tarjeta */}
          <Label text="Tarjeta asociada" />
          <Pressable onPress={() => setShowCardPicker(true)} style={[s.field, { backgroundColor: colors.surface }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.subtext} />
            <View style={{ flex: 1 }}>
              {selectedCard
                ? <CardChip card={selectedCard} colors={colors} />
                : <Text style={[s.input, { color: colors.muted }]}>Sin tarjeta seleccionada</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </Pressable>
          <CardPickerModal
            visible={showCardPicker}
            selectedCardId={selectedCard?.id}
            onSelect={c => setSelectedCard(c)}
            onClose={() => setShowCardPicker(false)}
          />

          {/* Notas */}
          <Label text="Notas" />
          <View style={[s.field, s.notes, { backgroundColor: colors.surface }]}>
            <TextInput
              placeholder="Cuenta compartida, usuarios, correo de acceso…"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              style={[s.notesInput, { color: colors.text }]}
            />
          </View>

          <GradientButton
            label={saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar suscripción'}
            icon={isEdit ? 'checkmark-circle' : 'add-circle'}
            onPress={handleSave}
            disabled={saving}
            style={{ marginHorizontal: spacing.screen, marginTop: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Label({ text, hint }: { text: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.labelWrap}>
      <Text style={[s.label, { color: colors.text }]}>{text}</Text>
      {hint && <Text style={[s.labelHint, { color: colors.subtext }]}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  customWrap: { marginHorizontal: spacing.screen, marginTop: 4 },
  custom: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 16 },
  customIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  customTitle: { fontSize: 17, fontWeight: '800' },
  customSub: { opacity: 0.75, fontSize: 12, fontWeight: '500', marginTop: 2 },

  preview: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: spacing.screen, marginTop: 16, borderRadius: radius.lg, padding: 18 },
  previewName: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  previewPrice: { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 },
  previewCycle: { fontSize: 14, fontWeight: '400' },
  previewHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  labelWrap: { marginHorizontal: spacing.screen, marginTop: 24, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700' },
  labelHint: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.screen, borderRadius: radius.md, paddingHorizontal: 16, minHeight: 54 },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 14 },

  priceCard: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: spacing.screen, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 10 },
  dollar: { fontSize: 28, fontWeight: '700' },
  priceInput: { flex: 1, fontSize: 40, fontWeight: '800', letterSpacing: -1.2, paddingVertical: 0 },
  mxn: { fontSize: 13, fontWeight: '600' },

  picker: { marginHorizontal: spacing.screen, marginTop: 10, borderRadius: radius.md, padding: 8 },
  pickerDone: { alignItems: 'flex-end', padding: 8 },

  iconsRow: { paddingHorizontal: spacing.screen, gap: 10 },
  iconSwatch: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.screen },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },

  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.screen, marginTop: 24, borderRadius: radius.md, padding: 14 },
  toggleIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  toggleSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },

  pmGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screen - 5 },
  pmCell: { width: '50%', padding: 5 },
  pm: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 12, gap: 8 },
  pmLabel: { flex: 1, fontSize: 13, fontWeight: '600' },

  notes: { alignItems: 'flex-start' },
  notesInput: { flex: 1, fontSize: 15, fontWeight: '400', minHeight: 90, paddingVertical: 14, lineHeight: 21 },
});
