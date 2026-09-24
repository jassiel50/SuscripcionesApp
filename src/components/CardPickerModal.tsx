import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, ToastAndroid,
  View, useColorScheme,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { siVisa, siMastercard } from 'simple-icons';
import { usePaymentCards } from '../hooks/usePaymentCards';
import { useTheme } from '../hooks/useTheme';
import { enter, tapHaptic } from '../theme/motion';
import { radius, spacing, type } from '../theme/tokens';
import {
  EmptyState, FilterPills, Glass, GradientButton, PressableScale, ScreenBackground,
} from './ui';
import type { CardBrand, CardKind, PaymentCard } from '../types';

// ── Brand helpers ─────────────────────────────────────────────────────────────

type BrandMeta = { label: string; color: string; svgPath: string | null; textFallback: string };

const BRAND_META: Record<CardBrand, BrandMeta> = {
  visa:       { label: 'Visa',       color: '#1A1F71', svgPath: siVisa.path,       textFallback: 'VISA' },
  mastercard: { label: 'Mastercard', color: '#EB001B', svgPath: siMastercard.path, textFallback: 'MC'   },
  amex:       { label: 'Amex',       color: '#007BC1', svgPath: null,              textFallback: 'AMEX' },
  other:      { label: 'Otra',       color: '#8E8E93', svgPath: null,              textFallback: '••'   },
};

const BANKS = ['BBVA', 'Banamex', 'Banorte', 'Santander', 'HSBC', 'Inbursa', 'Scotiabank', 'Otro'];

function lum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function cardLabel(card: PaymentCard): string {
  if (card.kind === 'clabe') return `CLABE •••• ${card.last_digits} · ${card.bank}`;
  const brand = BRAND_META[card.brand].label;
  const type  = card.kind === 'credit' ? 'Crédito' : 'Débito';
  return `${brand} ${type} •••• ${card.last_digits}`;
}

// ── Brand SVG icon ────────────────────────────────────────────────────────────
// Exported so profile.tsx puede usarlo para el ícono izquierdo de la tarjeta

export function BrandSvgIcon({ brand, size }: { brand: CardBrand; size: number }) {
  const dark = useColorScheme() === 'dark';
  const meta = BRAND_META[brand];

  if (brand === 'mastercard') {
    // Dos círculos superpuestos — vivo sobre cualquier fondo
    const r = size * 0.37;
    const cy = size / 2;
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size * 0.35} cy={cy} r={r} fill="#EB001B" />
        <Circle cx={size * 0.65} cy={cy} r={r} fill="#F79E1B" opacity={0.92} />
        <Circle cx={size * 0.35} cy={cy} r={r} fill="#FF5F00" opacity={0.38} />
      </Svg>
    );
  }

  if (!meta.svgPath) {
    const color = dark ? '#FFFFFF' : meta.color;
    return <Text style={{ fontSize: size * 0.42, fontWeight: '800', color }}>{meta.textFallback}</Text>;
  }

  // Visa (y cualquier marca SVG futura): se aclara en oscuro si el color es muy oscuro
  const brandLum = lum(meta.color);
  const iconColor = dark && brandLum < 0.25 ? '#FFFFFF' : meta.color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={meta.svgPath} fill={iconColor} />
    </Svg>
  );
}

// Color de fondo del ícono según modo oscuro
export function brandIconBg(brand: CardBrand, dark: boolean): string {
  const meta = BRAND_META[brand];
  const brandLum = lum(meta.color);
  if (dark && brandLum < 0.25) return 'rgba(255,255,255,0.13)';
  return meta.color + '22';
}

// ── Chip de tarjeta (visualización pequeña) ────────────────────────────────────

export function CardChip({ card, colors }: { card: PaymentCard; colors: ReturnType<typeof useTheme>['colors'] }) {
  const dark = useColorScheme() === 'dark';

  if (card.kind === 'clabe') {
    return (
      <View style={[chip.wrap, { backgroundColor: colors.vivid[0] + '22' }]}>
        <Ionicons name="swap-horizontal-outline" size={14} color={colors.vivid[0]} />
        <Text style={[chip.text, { color: colors.vivid[0] }]}>
          CLABE •••• {card.last_digits} · {card.bank}
        </Text>
      </View>
    );
  }

  const meta = BRAND_META[card.brand];
  const brandLum = lum(meta.color);
  const isDarkBrand = dark && brandLum < 0.25;
  const chipColor = isDarkBrand ? '#FFFFFF' : meta.color;
  const chipBg = isDarkBrand ? 'rgba(255,255,255,0.13)' : meta.color + '20';

  return (
    <View style={[chip.wrap, { backgroundColor: chipBg }]}>
      <BrandSvgIcon brand={card.brand} size={20} />
      <Text style={[chip.text, { color: chipColor }]}>
        •••• {card.last_digits} · {card.kind === 'credit' ? 'Crédito' : 'Débito'}
      </Text>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  text: { fontSize: 13, fontWeight: '600' },
});

// ── Encabezado del modal (vidrio, a juego con StackHeader) ─────────────────────

function ModalHeader({
  title, left, right,
}: {
  title: string; left: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void };
  right?: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[h.row, { paddingTop: insets.top + 12 }]}>
      <PressableScale onPress={() => { tapHaptic(); left.onPress(); }} scaleTo={0.88} accessibilityRole="button" accessibilityLabel={left.label}>
        <Glass radius={20} interactive><View style={h.btn}><Ionicons name={left.icon} size={19} color={colors.text} /></View></Glass>
      </PressableScale>
      <Text style={[type.h3, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
      {right ? (
        <PressableScale onPress={() => { tapHaptic(); right.onPress(); }} scaleTo={0.88} accessibilityRole="button" accessibilityLabel={right.label}>
          <Glass radius={20} interactive><View style={h.btn}><Ionicons name={right.icon} size={19} color={colors.text} /></View></Glass>
        </PressableScale>
      ) : <View style={h.btn} />}
    </View>
  );
}

const h = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screen - 4, paddingBottom: 12 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

// ── Formulario para agregar tarjeta ────────────────────────────────────────────

type AddFormProps = {
  onSave: (card: Omit<PaymentCard, 'id' | 'created_at'>) => Promise<void>;
  colors: ReturnType<typeof useTheme>['colors'];
};

function AddCardForm({ onSave, colors }: AddFormProps) {
  const [kind,   setKind]   = useState<CardKind>('credit');
  const [brand,  setBrand]  = useState<CardBrand>('visa');
  const [alias,  setAlias]  = useState('');
  const [digits, setDigits] = useState('');
  const [clabe,  setClabe]  = useState('');
  const [bank,   setBank]   = useState('');
  const [saving, setSaving] = useState(false);

  const isClabe = kind === 'clabe';

  const validate = () => {
    if (!alias.trim()) { Alert.alert('Falta alias', 'Ponle un nombre a esta tarjeta.'); return false; }
    if (isClabe) {
      if (!/^\d{18}$/.test(clabe)) { Alert.alert('CLABE inválida', 'Debe tener exactamente 18 dígitos.'); return false; }
    } else {
      if (!/^\d{4,6}$/.test(digits)) { Alert.alert('Dígitos inválidos', 'Ingresa los últimos 4 o 6 dígitos.'); return false; }
    }
    if (!bank.trim()) { Alert.alert('Falta banco', 'Selecciona o escribe el nombre del banco.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const cardData: Omit<PaymentCard, 'id' | 'created_at'> = {
      alias: alias.trim(),
      kind,
      brand: isClabe ? 'other' : brand,
      last_digits: isClabe ? clabe.slice(-4) : digits,
      bank: bank.trim(),
    };
    if (isClabe) cardData.clabe = clabe;
    await onSave(cardData);
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        <Text style={[f.label, { color: colors.text }]}>Tipo</Text>
        <FilterPills<CardKind>
          value={kind}
          onChange={setKind}
          options={[{ key: 'credit', label: 'Crédito' }, { key: 'debit', label: 'Débito' }, { key: 'clabe', label: 'CLABE' }]}
        />

        {!isClabe && (
          <>
            <Text style={[f.label, { color: colors.text }]}>Marca</Text>
            <View style={f.segRow}>
              {(Object.keys(BRAND_META) as CardBrand[]).map(b => {
                const meta = BRAND_META[b];
                const active = brand === b;
                return (
                  <PressableScale key={b} onPress={() => setBrand(b)} style={[f.seg, { backgroundColor: active ? meta.color : colors.surface }]}>
                    <Text style={[f.segText, { color: active ? '#fff' : colors.subtext }]}>{meta.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </>
        )}

        <Text style={[f.label, { color: colors.text }]}>Alias</Text>
        <View style={[f.inputRow, { backgroundColor: colors.surface }]}>
          <Ionicons name="pricetag-outline" size={18} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text }]}
            placeholder={isClabe ? 'Mi CLABE Banamex' : 'Mi Visa BBVA'}
            placeholderTextColor={colors.muted}
            value={alias}
            onChangeText={setAlias}
          />
        </View>

        <Text style={[f.label, { color: colors.text }]}>{isClabe ? 'CLABE (18 dígitos)' : 'Últimos 4 o 6 dígitos'}</Text>
        <View style={[f.inputRow, { backgroundColor: colors.surface }]}>
          <Ionicons name={isClabe ? 'swap-horizontal-outline' : 'card-outline'} size={18} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text, letterSpacing: isClabe ? 1.5 : 3 }]}
            placeholder={isClabe ? '••••••••••••••••••' : '••••'}
            placeholderTextColor={colors.muted}
            value={isClabe ? clabe : digits}
            onChangeText={isClabe ? setClabe : setDigits}
            keyboardType="number-pad"
            maxLength={isClabe ? 18 : 6}
          />
          {(isClabe ? clabe : digits).length > 0 && (
            <Text style={[f.counter, { color: colors.subtext }]}>
              {(isClabe ? clabe : digits).length}/{isClabe ? 18 : '4-6'}
            </Text>
          )}
        </View>

        <Text style={[f.label, { color: colors.text }]}>Banco</Text>
        <View style={[f.inputRow, { backgroundColor: colors.surface, marginBottom: 12 }]}>
          <Ionicons name="business-outline" size={18} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text }]}
            placeholder="BBVA, Banamex…"
            placeholderTextColor={colors.muted}
            value={bank}
            onChangeText={setBank}
          />
        </View>
        <FilterPills<string>
          value={bank}
          onChange={b => setBank(b === 'Otro' ? '' : b)}
          options={BANKS.map(b => ({ key: b, label: b }))}
        />

        <GradientButton
          label={saving ? 'Guardando…' : 'Guardar tarjeta'}
          icon="checkmark"
          onPress={handleSave}
          disabled={saving}
          style={{ marginHorizontal: spacing.screen, marginTop: 26 }}
        />
        {saving && <ActivityIndicator style={{ marginTop: 12 }} color={colors.subtext} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const f = StyleSheet.create({
  label:    { fontSize: 14, fontWeight: '700', marginHorizontal: spacing.screen, marginTop: 22, marginBottom: 10 },
  segRow:   { flexDirection: 'row', marginHorizontal: spacing.screen, gap: 8, flexWrap: 'wrap' },
  seg:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  segText:  { fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.screen, borderRadius: radius.md, paddingHorizontal: 16, minHeight: 54 },
  input:    { flex: 1, fontSize: 16, fontWeight: '500' },
  counter:  { fontSize: 12, fontWeight: '500' },
});

// ── Modal principal ─────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  selectedCardId?: string;
  onSelect: (card: PaymentCard | null) => void;
  onClose: () => void;
}

export default function CardPickerModal({ visible, selectedCardId, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { cards, addCard, removeCard } = usePaymentCards();
  const [mode, setMode] = useState<'list' | 'add'>('list');

  const handleAdd = async (card: Omit<PaymentCard, 'id' | 'created_at'>) => {
    await addCard(card);
    setMode('list');
  };

  const handleDelete = (card: PaymentCard) => {
    Alert.alert('Eliminar tarjeta', `¿Eliminar "${card.alias}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeCard(card.id) },
    ]);
  };

  const close = () => { setMode('list'); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <ScreenBackground scene="neutral" />

        {mode === 'list' ? (
          <>
            <ModalHeader
              title="Tarjeta / CLABE"
              left={{ icon: 'close', label: 'Cerrar', onPress: close }}
              right={{ icon: 'add', label: 'Agregar tarjeta', onPress: () => setMode('add') }}
            />
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
              {/* Sin tarjeta */}
              <Animated.View entering={enter(0)}>
                <PressableScale
                  onPress={() => { onSelect(null); close(); }}
                  style={[m.cardRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                >
                  <View style={[m.iconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="close" size={18} color={colors.subtext} />
                  </View>
                  <Text style={[m.cardAlias, { color: colors.subtext, flex: 1 }]}>Sin tarjeta asociada</Text>
                  {!selectedCardId && <Ionicons name="checkmark-circle" size={20} color={colors.vivid[0]} />}
                </PressableScale>
              </Animated.View>

              {/* Lista de tarjetas */}
              {cards.map((card, i) => {
                const isSelected = card.id === selectedCardId;
                const isClabe = card.kind === 'clabe';
                const iconBg = isClabe ? colors.vivid[0] + '22' : brandIconBg(card.brand, dark);
                const iconColor = isClabe ? colors.vivid[0] : null;

                const copyClabe = async () => {
                  if (!card.clabe) return;
                  await Clipboard.setStringAsync(card.clabe);
                  if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
                  else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
                };

                return (
                  <Animated.View key={card.id} entering={enter(i + 1)}>
                    <PressableScale
                      onPress={() => { onSelect(card); close(); }}
                      onLongPress={() => handleDelete(card)}
                      style={[m.cardRow, {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.vivid[0] : colors.cardBorder,
                        borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
                      }]}
                    >
                      <View style={[m.iconWrap, { backgroundColor: iconBg }]}>
                        {isClabe
                          ? <Ionicons name="swap-horizontal-outline" size={18} color={iconColor!} />
                          : <BrandSvgIcon brand={card.brand} size={28} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[m.cardAlias, { color: colors.text }]}>{card.alias}</Text>
                        {isClabe && card.clabe ? (
                          <Text style={[m.clabeText, { color: colors.vivid[0] }]}>
                            {card.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}
                          </Text>
                        ) : (
                          <Text style={[m.cardSub, { color: colors.subtext }]}>{cardLabel(card)}</Text>
                        )}
                      </View>
                      {isClabe && card.clabe && (
                        <PressableScale onPress={copyClabe} hitSlop={8} style={[m.copyBtn, { backgroundColor: colors.vivid[0] + '22' }]}>
                          <Ionicons name="copy-outline" size={14} color={colors.vivid[0]} />
                          <Text style={[m.copyText, { color: colors.vivid[0] }]}>Copiar</Text>
                        </PressableScale>
                      )}
                      {isSelected && !isClabe && <Ionicons name="checkmark-circle" size={20} color={colors.vivid[0]} />}
                    </PressableScale>
                  </Animated.View>
                );
              })}

              {cards.length === 0 && (
                <EmptyState
                  icon="card-outline"
                  title="Sin tarjetas guardadas"
                  body="Agrega una tarjeta o CLABE para vincularla a tus suscripciones."
                  cta="Agregar tarjeta"
                  onCta={() => setMode('add')}
                />
              )}

              {cards.length > 0 && (
                <Text style={[m.hint, { color: colors.muted }]}>Mantén presionada una tarjeta para eliminarla</Text>
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <ModalHeader title="Nueva tarjeta" left={{ icon: 'arrow-back', label: 'Regresar', onPress: () => setMode('list') }} />
            <AddCardForm onSave={handleAdd} colors={colors} />
          </>
        )}
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  cardRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  iconWrap:   { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardAlias:  { fontSize: 15, fontWeight: '600' },
  cardSub:    { fontSize: 12, fontWeight: '400', marginTop: 2 },
  hint:       { textAlign: 'center', fontSize: 12, fontWeight: '400', marginTop: 8 },
  clabeText:  { fontSize: 13, fontWeight: '600', letterSpacing: 1.2, marginTop: 2 },
  copyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  copyText:   { fontSize: 12, fontWeight: '700' },
});
