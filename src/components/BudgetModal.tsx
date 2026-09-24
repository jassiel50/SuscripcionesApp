import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { radius, type } from '../theme/tokens';
import { GradientButton } from './ui/primitives';
import { moneyShort } from '../utils/format';

const PRESETS = [500, 1000, 1500, 2500];

export default function BudgetModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { budget, setBudget, monthlyTotal } = useSubscriptions();
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (visible) setRaw(String(Math.round(budget)));
  }, [visible, budget]);

  const save = () => {
    const value = parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(value) && value > 0) setBudget(value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: colors.bg }]}>
          <View style={[s.handle, { backgroundColor: colors.separator }]} />
          <Text style={[type.h1, { color: colors.text }]}>Presupuesto mensual</Text>
          <Text style={[type.body, { color: colors.subtext, marginTop: 6 }]}>
            Hoy gastas {moneyShort(monthlyTotal)} al mes. ¿Cuál es tu límite?
          </Text>

          <View style={[s.inputWrap, { backgroundColor: colors.surface }]}>
            <Text style={[s.currency, { color: colors.subtext }]}>$</Text>
            <TextInput
              style={[s.input, { color: colors.text }]}
              value={raw}
              onChangeText={setRaw}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={save}
            />
            <Text style={[s.currency, { color: colors.subtext, fontSize: 15 }]}>MXN</Text>
          </View>

          <View style={s.presets}>
            {PRESETS.map(p => (
              <Pressable key={p} onPress={() => setRaw(String(p))} style={[s.preset, { borderColor: colors.vivid[0] }]}>
                <Text style={[s.presetText, { color: colors.vivid[0] }]}>{moneyShort(p)}</Text>
              </Pressable>
            ))}
          </View>

          <GradientButton label="Guardar presupuesto" icon="checkmark" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: 40, gap: 4 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 14, marginTop: 20 },
  currency: { fontSize: 26, fontWeight: '800' },
  input: { flex: 1, fontSize: 36, fontWeight: '900', letterSpacing: -1, paddingVertical: 0 },
  presets: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  preset: { flex: 1, borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 9, alignItems: 'center' },
  presetText: { fontSize: 14, fontWeight: '700' },
});
