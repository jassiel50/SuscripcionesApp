/**
 * Android row — Material You with dark mode + Subly design.
 * TODO (dev build): Consider @expo/ui Jetpack Compose Host for native ListItem.
 */
import React from 'react';
import { StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { Subscription } from '../types';

interface Props {
  item: Subscription;
  onPress: (item: Subscription) => void;
  showSeparator: boolean;
}

function renewalLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff < 7) return `En ${diff} días`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function SubscriptionRow({ item, onPress, showSeparator }: Props) {
  const { colors, dark } = useTheme();
  const label = renewalLabel(item.next_renewal);
  const isUrgent = label === 'Hoy' || label === 'Mañana';

  return (
    <>
      <TouchableNativeFeedback
        onPress={() => onPress(item)}
        background={TouchableNativeFeedback.Ripple(dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', false)}
      >
        <View style={[s.row, { backgroundColor: colors.card }]}>
          <View style={[s.icon, { backgroundColor: item.color }]}>
            <Text style={s.iconLetter}>{item.name[0]}</Text>
          </View>
          <View style={s.info}>
            <Text style={[s.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[s.renewal, { color: isUrgent ? colors.urgent : colors.subtext }]}>{label}</Text>
          </View>
          <View style={s.right}>
            <Text style={[s.price, { color: colors.subtext }]}>${item.price.toFixed(2)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </View>
        </View>
      </TouchableNativeFeedback>
      {showSeparator && <View style={[s.divider, { backgroundColor: colors.separator, marginLeft: 64 }]} />}
    </>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconLetter: { color: '#fff', fontSize: 17, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500' },
  renewal: { fontSize: 13, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth },
});
