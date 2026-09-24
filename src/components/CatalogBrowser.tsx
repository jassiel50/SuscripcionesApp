import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SubIcon } from '../utils/brandIcons';
import { moneyShort } from '../utils/format';
import { radius, spacing, type } from '../theme/tokens';
import { FilterPills, PressableScale, SearchField, Tag } from './ui/primitives';
import { ScreenBackground } from './ui/glass';
import { useStackHeaderSpace } from './ui/chrome';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ALL_CATEGORIES, PREDEFINED_SUBSCRIPTIONS,
  type Plan, type PredefinedSubscription, type ServiceCategory,
} from '../../constants/subscriptions';

type Cat = ServiceCategory | 'Todos';

const CARD_W = (Dimensions.get('window').width - spacing.screen * 2 - 12) / 2;

/**
 * Catálogo de servicios con precios MXN. Se usa en:
 *  - /catalog (pantalla "Explorar")
 *  - /subscription/new (paso 1 del alta)
 */
export default function CatalogBrowser({
  onSelectPlan, header, bottomInset = 24,
}: {
  onSelectPlan: (sub: PredefinedSubscription, plan: Plan) => void;
  header?: React.ReactElement;
  bottomInset?: number;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerSpace = useStackHeaderSpace();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Cat>('Todos');
  const [selected, setSelected] = useState<PredefinedSubscription | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PREDEFINED_SUBSCRIPTIONS.filter(s =>
      (cat === 'Todos' || s.categoria === cat) && (!q || s.nombre.toLowerCase().includes(q)));
  }, [query, cat]);

  const pick = (plan: Plan) => {
    const sub = selected;
    setSelected(null);
    if (sub) onSelectPlan(sub, plan);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground scene="neutral" />
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={s.gridRow}
        contentContainerStyle={{ paddingTop: headerSpace + 8, paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 16 }}>
            {header}
            <SearchField placeholder="Buscar servicio…" value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
            <FilterPills<Cat>
              value={cat}
              onChange={setCat}
              options={(['Todos', ...ALL_CATEGORIES] as Cat[]).map(c => ({ key: c, label: c }))}
            />
          </View>
        }
        renderItem={({ item, index }) => {
          const min = Math.min(...item.planes.map(p => p.precioMensual));
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).springify().damping(20)}>
            <PressableScale onPress={() => setSelected(item)} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} accessibilityRole="button" accessibilityLabel={item.nombre}>
              <SubIcon name={item.nombre} subId={item.id} color={item.color} size={54} borderRadius={27} />
              <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>{item.nombre}</Text>
              <Text style={[s.cardCat, { color: colors.subtext }]}>{item.categoria}</Text>
              <View style={s.cardBottom}>
                <Text style={[s.cardFrom, { color: colors.subtext }]}>desde</Text>
                <Text style={[s.cardPrice, { color: colors.text }]}>{moneyShort(min)}</Text>
              </View>
            </PressableScale>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={40} color={colors.muted} />
            <Text style={[type.body, { color: colors.subtext }]}>Sin resultados</Text>
          </View>
        }
      />

      {/* Hoja de planes */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.sheetRoot}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={() => setSelected(null)} />
          {selected && (
            <View style={[s.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 20 }]}>
              <View style={[s.handle, { backgroundColor: colors.separator }]} />
              <View style={s.sheetHead}>
                <SubIcon name={selected.nombre} subId={selected.id} color={selected.color} size={60} borderRadius={30} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[type.h1, { color: colors.text }]}>{selected.nombre}</Text>
                  <Tag label={selected.categoria} color={selected.color} />
                </View>
                <Pressable onPress={() => setSelected(null)} hitSlop={10} style={[s.close, { backgroundColor: colors.surface }]}>
                  <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>
              </View>

              <Text style={[type.h3, { color: colors.subtext, marginBottom: 10 }]}>Elige tu plan</Text>
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {selected.planes.map((plan, i) => (
                  <PressableScale key={i} onPress={() => pick(plan)} style={[s.plan, { backgroundColor: colors.surface }]}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[type.bodyBold, { color: colors.text }]}>{plan.nombre}</Text>
                      <Text style={[s.planDesc, { color: colors.subtext }]}>{plan.descripcion}</Text>
                      {plan.periodo === 'anual' && (
                        <Text style={[s.planAnnual, { color: colors.success }]}>Pago anual · {moneyShort(plan.precio)}/año</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.planPrice, { color: colors.text }]}>{moneyShort(plan.precioMensual)}</Text>
                      <Text style={[s.planPer, { color: colors.subtext }]}>/mes</Text>
                    </View>
                    <View style={[s.planGo, { backgroundColor: colors.accent }]}>
                      <Ionicons name="add" size={18} color={colors.onInk} />
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  gridRow: { gap: 12, paddingHorizontal: spacing.screen, marginBottom: 12 },
  card: { width: CARD_W, borderRadius: radius.lg, padding: 16, gap: 4, borderWidth: StyleSheet.hairlineWidth },
  cardName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, marginTop: 10 },
  cardCat: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  cardFrom: { fontSize: 11, fontWeight: '700' },
  cardPrice: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, padding: 16, marginBottom: 10 },
  planDesc: { fontSize: 12, fontWeight: '600' },
  planAnnual: { fontSize: 12, fontWeight: '800' },
  planPrice: { fontSize: 18, fontWeight: '900' },
  planPer: { fontSize: 11, fontWeight: '700' },
  planGo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
