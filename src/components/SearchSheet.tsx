import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { SearchField, SubscriptionRow } from './ui';
import { radius, spacing, type } from '../theme/tokens';

/**
 * Búsqueda global de suscripciones, accesible desde el botón central de la
 * tab bar en cualquier pantalla. Hoja que sube desde abajo; sin resultado de
 * texto muestra todas las suscripciones (para hojear rápido).
 */
export default function SearchSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(s => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q));
  }, [subscriptions, query]);

  const close = () => { onClose(); setQuery(''); };
  const go = (id: string) => { close(); router.push(`/subscription/${id}`); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.root}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={close} />
        <View style={[s.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }]}>
          <View style={[s.handle, { backgroundColor: colors.separator }]} />
          <View style={s.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchField
                compact
                autoFocus
                placeholder="Buscar suscripción…"
                value={query}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
              />
            </View>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar búsqueda">
              <Text style={[type.bodyBold, { color: colors.text }]}>Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            {results.map(sub => (
              <SubscriptionRow key={sub.id} sub={sub} onPress={() => go(sub.id)} />
            ))}
            {results.length === 0 && (
              <Text style={[type.body, { color: colors.subtext, textAlign: 'center', marginTop: 32 }]}>Sin resultados</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { height: '86%', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.screen, paddingTop: 12 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  list: { paddingTop: 8, paddingBottom: 12 },
});
