import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface Props { visible: boolean; onClose: () => void }

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AddSubscriptionModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [remind, setRemind] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[s.root, { backgroundColor: colors.bg }]}
      >
        {/* Header */}
        <View style={[s.modalHeader, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: colors.subtext }]}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>Nueva suscripción</Text>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: colors.accent }]}>
            <Text style={s.doneBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>

          {/* Sección: Servicio */}
          <Text style={[s.sectionLabel, { color: colors.subtext }]}>Servicio</Text>
          <View style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={s.field}>
              <View style={[s.fieldIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="search" size={16} color={colors.accent} />
              </View>
              <TextInput
                placeholder="Nombre del servicio"
                placeholderTextColor={colors.subtext}
                style={[s.fieldInput, { color: colors.text }]}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.separator, marginLeft: 56 }]} />
            <View style={s.field}>
              <View style={[s.fieldIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="cash-outline" size={16} color={colors.accent} />
              </View>
              <Text style={[s.dollarSign, { color: colors.text }]}>$</Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={colors.subtext}
                keyboardType="decimal-pad"
                style={[s.fieldInput, { flex: 0, width: 80, color: colors.text }]}
              />
              <View style={[s.segmented, { backgroundColor: colors.separator }]}>
                <TouchableOpacity
                  style={[s.segment, billing === 'monthly' && { backgroundColor: colors.accent }]}
                  onPress={() => setBilling('monthly')}
                >
                  <Text style={[s.segmentLabel, { color: billing === 'monthly' ? '#fff' : colors.subtext }]}>
                    Mensual
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.segment, billing === 'yearly' && { backgroundColor: colors.accent }]}
                  onPress={() => setBilling('yearly')}
                >
                  <Text style={[s.segmentLabel, { color: billing === 'yearly' ? '#fff' : colors.subtext }]}>
                    Anual
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sección: Detalles */}
          <Text style={[s.sectionLabel, { color: colors.subtext }]}>Detalles</Text>
          <View style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <TouchableOpacity
              style={s.field}
              onPress={() => setShowDatePicker(v => !v)}
              activeOpacity={0.7}
            >
              <View style={[s.fieldIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              </View>
              <Text style={[s.fieldLabel, { color: colors.text }]}>Próximo cobro</Text>
              <Text style={[s.fieldValue, { color: showDatePicker ? colors.accent : colors.subtext }]}>
                {formatDisplay(date)}
              </Text>
              <Ionicons
                name={showDatePicker ? 'chevron-up' : 'chevron-forward'}
                size={16}
                color={colors.subtext}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <View style={[s.pickerWrapper, { borderTopColor: colors.separator }]}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="es-MX"
                  style={s.datePicker}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={s.pickerDoneBtn}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={[s.pickerDoneText, { color: colors.accent }]}>Listo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={[s.divider, { backgroundColor: colors.separator, marginLeft: 56 }]} />
            <TouchableOpacity style={s.field} activeOpacity={0.7}>
              <View style={[s.fieldIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="folder-outline" size={16} color={colors.accent} />
              </View>
              <Text style={[s.fieldLabel, { color: colors.text }]}>Categoría</Text>
              <Text style={[s.fieldValue, { color: colors.subtext }]}>Entretenimiento</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.subtext} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <View style={[s.divider, { backgroundColor: colors.separator, marginLeft: 56 }]} />
            <View style={s.field}>
              <View style={[s.fieldIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="notifications-outline" size={16} color={colors.accent} />
              </View>
              <Text style={[s.fieldLabel, { color: colors.text }]}>Recordatorio</Text>
              <Switch
                value={remind}
                onValueChange={setRemind}
                trackColor={{ false: colors.separator, true: colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={colors.separator}
              />
            </View>
          </View>

          {/* Info */}
          <View style={[s.infoBox, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            <Text style={[s.infoText, { color: colors.accent }]}>
              {billing === 'monthly'
                ? `Se cobrará cada mes el día ${date.getDate()}`
                : `Se cobrará cada año el ${formatDisplay(date)}`}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 70 },
  headerBtnText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  scroll: { paddingVertical: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginHorizontal: 20, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldInput: { flex: 1, fontSize: 16 },
  dollarSign: { fontSize: 16, marginRight: 2 },
  fieldLabel: { flex: 1, fontSize: 16 },
  fieldValue: { fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth },
  segmented: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    marginLeft: 8,
  },
  segment: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  segmentLabel: { fontSize: 13, fontWeight: '500' },
  pickerWrapper: { paddingHorizontal: 8, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  datePicker: { width: '100%' },
  pickerDoneBtn: { alignItems: 'flex-end', paddingRight: 16, paddingBottom: 4 },
  pickerDoneText: { fontSize: 16, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
