import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions, FlatList, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isExpoGo } from '../../src/utils/env';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { SubIcon } from '../../src/utils/brandIcons';
import {
  ALL_CATEGORIES,
  PREDEFINED_SUBSCRIPTIONS,
  type Plan,
  type PredefinedSubscription,
  type ServiceCategory,
} from '../../constants/subscriptions';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 10) / 2;

function formatMXN(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}

// ── Subscription grid card ──────────────────────────────────────────────────────

function CatalogCard({
  sub, onPress,
}: {
  sub: PredefinedSubscription;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const minPrice = Math.min(...sub.planes.map(p => p.precioMensual));
  return (
    <TouchableOpacity
      style={[s.catalogCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <SubIcon name={sub.nombre} subId={sub.id} color={sub.color} size={52} borderRadius={14} />
      <Text style={[s.catalogName, { color: colors.text }]} numberOfLines={1}>{sub.nombre}</Text>
      <View style={[s.catalogCatPill, { backgroundColor: colors.accentSoft }]}>
        <Text style={[s.catalogCatText, { color: colors.accent }]}>{sub.categoria}</Text>
      </View>
      <Text style={[s.catalogFrom, { color: colors.subtext }]}>
        desde {formatMXN(minPrice)}/mes
      </Text>
    </TouchableOpacity>
  );
}

// ── Plan row inside detail panel ────────────────────────────────────────────────

function PlanRow({
  plan, color, onAdd,
}: {
  plan: Plan;
  color: string;
  onAdd: () => void;
}) {
  const { colors } = useTheme();
  const isAnnual = plan.periodo === 'anual';
  return (
    <View style={[s.planRow, { borderColor: colors.separator }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.planName, { color: colors.text }]}>{plan.nombre}</Text>
        <Text style={[s.planDesc, { color: colors.subtext }]}>{plan.descripcion}</Text>
        {isAnnual && (
          <View style={[s.annualBadge, { backgroundColor: '#34C75922' }]}>
            <Text style={s.annualBadgeText}>Pago anual · {formatMXN(plan.precio)}/año</Text>
          </View>
        )}
      </View>
      <View style={s.planRight}>
        <Text style={[s.planPrice, { color: colors.text }]}>{formatMXN(plan.precioMensual)}</Text>
        <Text style={[s.planPeriod, { color: colors.subtext }]}>/mes</Text>
        <TouchableOpacity
          style={[s.addPlanBtn, { backgroundColor: color }]}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.addPlanBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'Todos'>('Todos');
  const [selectedSub, setSelectedSub] = useState<PredefinedSubscription | null>(null);
  const [panelSub, setPanelSub] = useState<PredefinedSubscription | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelAnimating, setPanelAnimating] = useState(false);

  const panelTranslate = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openPanel = (sub: PredefinedSubscription) => {
    setPanelSub(sub);
    setSelectedSub(sub);
    panelTranslate.setValue(600);
    backdropOpacity.setValue(0);
    setPanelVisible(true);
    setPanelAnimating(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(panelTranslate, { toValue: 0, damping: 20, stiffness: 220, mass: 0.8, useNativeDriver: true }),
    ]).start(() => setPanelAnimating(false));
  };

  const closePanel = (callback?: () => void) => {
    setPanelAnimating(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.spring(panelTranslate, { toValue: 600, damping: 20, stiffness: 220, mass: 0.8, useNativeDriver: true }),
    ]).start(() => {
      setPanelSub(null);
      setPanelVisible(false);
      setSelectedSub(null);
      setPanelAnimating(false);
      callback?.();
    });
  };

  const filtered = useMemo(() => {
    let subs = PREDEFINED_SUBSCRIPTIONS;
    if (activeCategory !== 'Todos') subs = subs.filter(s => s.categoria === activeCategory);
    if (query.trim()) subs = subs.filter(s => s.nombre.toLowerCase().includes(query.toLowerCase()));
    return subs;
  }, [query, activeCategory]);

  const handleSelectPlan = (sub: PredefinedSubscription, plan: Plan) => {
    closePanel(() => {
      router.push(
        `/subscription/new?catalogId=${sub.id}&planName=${encodeURIComponent(plan.nombre)}&planPrice=${plan.precioMensual}&planPeriod=${plan.periodo}`,
      );
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={[s.largeTitle, { color: colors.text }]}>Explorar</Text>
        <TouchableOpacity
          style={[s.customBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/subscription/new?custom=true')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={colors.primaryText} />
          <Text style={[s.customBtnText, { color: colors.primaryText }]}>Personalizada</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="search" size={16} color={colors.subtext} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar servicio…"
          placeholderTextColor={colors.subtext}
          style={[s.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips — wrap so all are visible */}
      <View style={s.chipsRow}>
        {(['Todos', ...ALL_CATEGORIES] as (ServiceCategory | 'Todos')[]).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              s.chip,
              { backgroundColor: activeCategory === cat ? colors.primary : colors.card,
                borderColor: activeCategory === cat ? colors.primary : colors.cardBorder },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[s.chipText, { color: activeCategory === cat ? colors.primaryText : colors.subtext }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={s.gridRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: isExpoGo ? insets.bottom + 90 : 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CatalogCard
            sub={item}
            onPress={() => {
              if (selectedSub?.id === item.id) {
                closePanel();
              } else if (panelVisible) {
                setPanelSub(item);
                setSelectedSub(item);
              } else {
                openPanel(item);
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={44} color={colors.subtext} />
            <Text style={[s.emptyText, { color: colors.subtext }]}>Sin resultados</Text>
          </View>
        }
      />

      {/* Backdrop — pointerEvents none during animation so taps pass through to cards */}
      {panelVisible && (
        <Animated.View
          pointerEvents={panelAnimating ? 'none' : 'box-only'}
          style={[s.backdrop, { opacity: backdropOpacity }]}
          onTouchEnd={() => closePanel()}
        />
      )}

      {/* Plan bottom panel */}
      {panelVisible && panelSub && (
        <Animated.View
          style={[s.panel, {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            paddingBottom: insets.bottom + (isExpoGo ? 90 : 16),
            transform: [{ translateY: panelTranslate }],
          }]}
        >
          {/* Gradient hero header */}
          <View style={[s.panelHero, { backgroundColor: panelSub.color + '15' }]}>
            <View style={s.panelHandleWrap}>
              <View style={[s.panelHandle, { backgroundColor: panelSub.color + '50' }]} />
            </View>
            <View style={s.panelHeroRow}>
              <SubIcon name={panelSub.nombre} subId={panelSub.id} color={panelSub.color} size={52} borderRadius={16} />
              <View style={{ flex: 1 }}>
                <Text style={[s.panelTitle, { color: colors.text }]}>{panelSub.nombre}</Text>
                <View style={[s.panelCatPill, { backgroundColor: panelSub.color + '25' }]}>
                  <Text style={[s.panelCat, { color: panelSub.color }]}>{panelSub.categoria}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => closePanel()}
                style={[s.panelClose, { backgroundColor: colors.separator }]}
              >
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[s.panelSectionLabel, { color: colors.subtext }]}>Elige un plan</Text>
          <ScrollView style={s.panelPlans} showsVerticalScrollIndicator={false}>
            {panelSub.planes.map((plan, i) => (
              <PlanRow
                key={i}
                plan={plan}
                color={panelSub.color}
                onAdd={() => handleSelectPlan(panelSub, plan)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  largeTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  customBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  customBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 13, fontWeight: '500' },
  gridRow: { gap: 10, marginBottom: 10 },
  catalogCard: { width: CARD_W, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  catalogIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  catalogEmoji: { fontSize: 28 },
  catalogName: { fontSize: 15, fontWeight: '700' },
  catalogCatPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  catalogCatText: { fontSize: 11, fontWeight: '600' },
  catalogFrom: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // Bottom panel
  panel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0,
    paddingTop: 10, maxHeight: '78%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 16,
  },
  panelHero: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16, borderRadius: 0 },
  panelHandleWrap: { alignItems: 'center', marginBottom: 14 },
  panelHandle: { width: 40, height: 4, borderRadius: 2 },
  panelHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  panelCatPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  panelCat: { fontSize: 12, fontWeight: '600' },
  panelClose: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  panelSectionLabel: { fontSize: 15, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  panelPlans: { paddingHorizontal: 16 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  planName: { fontSize: 15, fontWeight: '600' },
  planDesc: { fontSize: 12, marginTop: 2 },
  annualBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  annualBadgeText: { fontSize: 11, color: '#34C759', fontWeight: '600' },
  planRight: { alignItems: 'flex-end', gap: 2 },
  planPrice: { fontSize: 16, fontWeight: '700' },
  planPeriod: { fontSize: 11 },
  addPlanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginTop: 6 },
  addPlanBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
