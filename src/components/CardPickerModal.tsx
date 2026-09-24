import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, ToastAndroid,
  TouchableOpacity, View, useColorScheme,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { siVisa, siMastercard } from 'simple-icons';
import { usePaymentCards } from '../hooks/usePaymentCards';
import { useTheme } from '../hooks/useTheme';
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
// Exported so profile.tsx can use it for the left-side card icon

export function BrandSvgIcon({ brand, size }: { brand: CardBrand; size: number }) {
  const dark = useColorScheme() === 'dark';
  const meta = BRAND_META[brand];

  if (brand === 'mastercard') {
    // Two overlapping circles — vivid on any background
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
    return <Text style={{ fontSize: size * 0.42, fontWeight: '900', color }}>{meta.textFallback}</Text>;
  }

  // Visa (and any future SVG brand): lighten in dark mode if color is too dark
  const brandLum = lum(meta.color);
  const iconColor = dark && brandLum < 0.25 ? '#FFFFFF' : meta.color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={meta.svgPath} fill={iconColor} />
    </Svg>
  );
}

// Background color for the icon wrap based on dark mode
export function brandIconBg(brand: CardBrand, dark: boolean): string {
  const meta = BRAND_META[brand];
  const brandLum = lum(meta.color);
  if (dark && brandLum < 0.25) return 'rgba(255,255,255,0.13)';
  return meta.color + '22';
}

// ── Card chip (small display) ─────────────────────────────────────────────────

export function CardChip({ card, colors }: { card: PaymentCard; colors: ReturnType<typeof useTheme>['colors'] }) {
  const dark = useColorScheme() === 'dark';

  if (card.kind === 'clabe') {
    return (
      <View style={[chip.wrap, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name="swap-horizontal-outline" size={14} color={colors.accent} />
        <Text style={[chip.text, { color: colors.accent }]}>
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

// ── Add-card form ─────────────────────────────────────────────────────────────

type AddFormProps = {
  onSave: (card: Omit<PaymentCard, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
};

function AddCardForm({ onSave, onCancel, colors }: AddFormProps) {
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

  const f = addStyles(colors);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Kind */}
        <Text style={f.label}>TIPO</Text>
        <View style={f.segRow}>
          {(['credit', 'debit', 'clabe'] as CardKind[]).map(k => (
            <TouchableOpacity
              key={k}
              style={[f.seg, kind === k && { backgroundColor: colors.accent }]}
              onPress={() => setKind(k)}
            >
              <Text style={[f.segText, { color: kind === k ? '#fff' : colors.subtext }]}>
                {k === 'credit' ? 'Crédito' : k === 'debit' ? 'Débito' : 'CLABE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Brand */}
        {!isClabe && (
          <>
            <Text style={f.label}>MARCA</Text>
            <View style={f.segRow}>
              {(Object.keys(BRAND_META) as CardBrand[]).map(b => {
                const meta = BRAND_META[b];
                return (
                  <TouchableOpacity
                    key={b}
                    style={[f.seg, brand === b && { backgroundColor: meta.color }]}
                    onPress={() => setBrand(b)}
                  >
                    <Text style={[f.segText, { color: brand === b ? '#fff' : colors.subtext }]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Alias */}
        <Text style={f.label}>ALIAS</Text>
        <View style={[f.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="pricetag-outline" size={16} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text }]}
            placeholder={isClabe ? 'Mi CLABE Banamex' : 'Mi Visa BBVA'}
            placeholderTextColor={colors.subtext}
            value={alias}
            onChangeText={setAlias}
          />
        </View>

        {/* Digits / CLABE */}
        <Text style={f.label}>{isClabe ? 'CLABE (18 DÍGITOS)' : 'ÚLTIMOS 4 O 6 DÍGITOS'}</Text>
        <View style={[f.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name={isClabe ? 'swap-horizontal-outline' : 'card-outline'} size={16} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text, letterSpacing: isClabe ? 1.5 : 3 }]}
            placeholder={isClabe ? '••••••••••••••••••' : '••••'}
            placeholderTextColor={colors.subtext}
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

        {/* Bank */}
        <Text style={f.label}>BANCO</Text>
        <View style={[f.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="business-outline" size={16} color={colors.subtext} />
          <TextInput
            style={[f.input, { color: colors.text }]}
            placeholder="BBVA, Banamex…"
            placeholderTextColor={colors.subtext}
            value={bank}
            onChangeText={setBank}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
            {BANKS.map(b => (
              <TouchableOpacity
                key={b}
                style={[f.bankChip, { backgroundColor: bank === b ? colors.accent : colors.card, borderColor: bank === b ? colors.accent : colors.cardBorder }]}
                onPress={() => setBank(b === 'Otro' ? '' : b)}
              >
                <Text style={[f.bankChipText, { color: bank === b ? '#fff' : colors.subtext }]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[f.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={f.saveBtnText}>Guardar tarjeta</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function addStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    label:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.subtext, marginHorizontal: 16, marginTop: 16, marginBottom: 6 },
    segRow:      { flexDirection: 'row', marginHorizontal: 16, gap: 6, marginBottom: 4, flexWrap: 'wrap' },
    seg:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.card },
    segText:     { fontSize: 13, fontWeight: '600' },
    inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4 },
    input:       { flex: 1, fontSize: 15 },
    counter:     { fontSize: 12 },
    bankChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
    bankChipText:{ fontSize: 12, fontWeight: '500' },
    saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 32, borderRadius: 14, paddingVertical: 15, gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  selectedCardId?: string;
  onSelect: (card: PaymentCard | null) => void;
  onClose: () => void;
}

export default function CardPickerModal({ visible, selectedCardId, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const dark = useColorScheme() === 'dark';
  const { cards, addCard, removeCard } = usePaymentCards();
  const [mode, setMode] = useState<'list' | 'add'>('list');

  const handleAdd = async (card: Omit<PaymentCard, 'id' | 'created_at'>) => {
    await addCard(card);
    setMode('list');
  };

  const handleDelete = (card: PaymentCard) => {
    Alert.alert(
      'Eliminar tarjeta',
      `¿Eliminar "${card.alias}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeCard(card.id) },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[m.root, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[m.header, { borderBottomColor: colors.separator }]}>
          {mode === 'add' ? (
            <TouchableOpacity onPress={() => setMode('list')}>
              <Ionicons name="arrow-back" size={22} color={colors.accent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose}>
              <Text style={[m.headerBtn, { color: colors.accent }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
          <Text style={[m.title, { color: colors.text }]}>
            {mode === 'list' ? 'Tarjeta / CLABE' : 'Nueva tarjeta'}
          </Text>
          {mode === 'list' ? (
            <TouchableOpacity onPress={() => setMode('add')}>
              <Ionicons name="add" size={24} color={colors.accent} />
            </TouchableOpacity>
          ) : <View style={{ width: 24 }} />}
        </View>

        {mode === 'list' ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {/* No card option */}
            <TouchableOpacity
              style={[m.cardRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => { onSelect(null); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={[m.iconWrap, { backgroundColor: colors.separator }]}>
                <Ionicons name="close" size={18} color={colors.subtext} />
              </View>
              <Text style={[m.cardAlias, { color: colors.subtext }]}>Sin tarjeta asociada</Text>
              {!selectedCardId && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </TouchableOpacity>

            {/* Card list */}
            {cards.map(card => {
              const isSelected = card.id === selectedCardId;
              const isClabe = card.kind === 'clabe';
              const iconBg = isClabe ? colors.accentSoft : brandIconBg(card.brand, dark);
              const iconColor = isClabe ? colors.accent : null;

              const copyClabe = async () => {
                if (!card.clabe) return;
                await Clipboard.setStringAsync(card.clabe);
                if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
                else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
              };

              return (
                <TouchableOpacity
                  key={card.id}
                  style={[m.cardRow, { backgroundColor: colors.card, borderColor: isSelected ? colors.accent : colors.cardBorder, borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth }]}
                  onPress={() => { onSelect(card); onClose(); }}
                  onLongPress={() => handleDelete(card)}
                  activeOpacity={0.7}
                >
                  <View style={[m.iconWrap, { backgroundColor: iconBg }]}>
                    {isClabe
                      ? <Ionicons name="swap-horizontal-outline" size={18} color={iconColor!} />
                      : <BrandSvgIcon brand={card.brand} size={28} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.cardAlias, { color: colors.text }]}>{card.alias}</Text>
                    {isClabe && card.clabe ? (
                      <Text style={[m.clabeText, { color: colors.accent }]}>
                        {card.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}
                      </Text>
                    ) : (
                      <Text style={[m.cardSub, { color: colors.subtext }]}>{cardLabel(card)}</Text>
                    )}
                  </View>
                  {isClabe && card.clabe && (
                    <TouchableOpacity
                      onPress={copyClabe}
                      style={[m.copyBtn, { backgroundColor: colors.accentSoft }]}
                      hitSlop={8}
                    >
                      <Ionicons name="copy-outline" size={14} color={colors.accent} />
                      <Text style={[m.copyText, { color: colors.accent }]}>Copiar</Text>
                    </TouchableOpacity>
                  )}
                  {isSelected && !isClabe && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}

            {cards.length === 0 && (
              <View style={m.empty}>
                <Ionicons name="card-outline" size={40} color={colors.subtext} />
                <Text style={[m.emptyText, { color: colors.subtext }]}>
                  Aún no tienes tarjetas guardadas
                </Text>
                <TouchableOpacity
                  style={[m.emptyBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setMode('add')}
                >
                  <Text style={m.emptyBtnText}>Agregar tarjeta</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[m.hint, { color: colors.subtext }]}>
              Mantén presionada una tarjeta para eliminarla
            </Text>
          </ScrollView>
        ) : (
          <AddCardForm
            onSave={handleAdd}
            onCancel={() => setMode('list')}
            colors={colors}
          />
        )}
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn:  { fontSize: 16 },
  title:      { fontSize: 17, fontWeight: '600' },
  cardRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  iconWrap:   { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardAlias:  { fontSize: 15, fontWeight: '600' },
  cardSub:    { fontSize: 13, marginTop: 2 },
  empty:      { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 32 },
  emptyText:  { fontSize: 15, textAlign: 'center' },
  emptyBtn:   { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  hint:       { textAlign: 'center', fontSize: 12, marginTop: 16 },
  clabeText:  { fontSize: 13, fontWeight: '600', letterSpacing: 1.2, marginTop: 2 },
  copyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  copyText:   { fontSize: 12, fontWeight: '600' },
});
