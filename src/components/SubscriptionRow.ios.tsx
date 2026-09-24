/**
 * iOS row — React Native with Subly design + dark mode.
 * TODO (dev build): Consider @expo/ui SwiftUI Host for native List.
 */
import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SubIcon } from '../utils/brandIcons';
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
  const { colors } = useTheme();
  const label = renewalLabel(item.next_renewal);
  const isUrgent = label === 'Hoy' || label === 'Mañana';

  return (
    <>
      <TouchableOpacity
        style={[s.row, { backgroundColor: colors.card }]}
        onPress={() => onPress(item)}
        activeOpacity={0.6}
      >
        <View style={{ marginRight: 12 }}>
          <SubIcon name={item.name} color={item.color} size={36} borderRadius={9} />
        </View>
        <View style={s.info}>
          <Text style={[s.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[s.renewal, { color: isUrgent ? colors.urgent : colors.subtext }]}>{label}</Text>
        </View>
        <Text style={[s.price, { color: colors.subtext }]}>${item.price.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
      {showSeparator && <View style={[s.separator, { backgroundColor: colors.separator, marginLeft: 60 }]} />}
    </>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconLetter: { color: '#fff', fontSize: 15, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500' },
  renewal: { fontSize: 13, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '500' },
  separator: { height: StyleSheet.hairlineWidth },
});
