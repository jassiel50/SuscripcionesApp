import React, { useCallback, useState } from 'react';
import {
  Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, ToastAndroid, View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/firebase';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import BudgetModal from '../../src/components/BudgetModal';
import CardPickerModal, { BrandSvgIcon, CardChip, brandIconBg } from '../../src/components/CardPickerModal';
import {
  LargeTitle, ScreenBackground, SectionHeader, TOP_BAR_H, TopBar, useScreenScroll, useTabBarSpace, type IoniconName,
} from '../../src/components/ui';
import { enter } from '../../src/theme/motion';
import { moneyShort } from '../../src/utils/format';
import { radius, spacing, type } from '../../src/theme/tokens';

/** Fondo suave para una insignia de color a partir de su tinte (hex u rgba). */
function badgeBg(tint: string, fallback: string): string {
  return tint.startsWith('#') ? tint + '22' : fallback;
}

type SettingRow = {
  icon: IoniconName; label: string; value?: string; onPress?: () => void; danger?: boolean; valueTone?: 'ok' | 'warn'; tint?: string;
};

export default function ProfileScreen() {
  const { subscriptions, monthlyTotal, yearlyTotal, budget } = useSubscriptions();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const { cards, removeCard, updateCard } = usePaymentCards();
  const bottom = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useScreenScroll();

  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCards, setEditingCards] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  // Estado real del permiso de notificaciones (se refresca al volver de Ajustes)
  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then(p => setNotifStatus(p.status as typeof notifStatus)).catch(() => {});
  }, []));

  const sortedCards = [...cards].sort((a, b) => {
    const ao = a.order ?? 999, bo = b.order ?? 999;
    return ao !== bo ? ao - bo : a.created_at.localeCompare(b.created_at);
  });

  const moveCard = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sortedCards.length) return;
    await updateCard(sortedCards[index].id, { order: target });
    await updateCard(sortedCards[target].id, { order: index });
  };

  const copyClabe = async (clabe: string) => {
    await Clipboard.setStringAsync(clabe);
    if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
    else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handleNotifications = async () => {
    if (notifStatus === 'undetermined') {
      const res = await Notifications.requestPermissionsAsync();
      setNotifStatus(res.status as typeof notifStatus);
    } else {
      Linking.openSettings();
    }
  };

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const email = user?.email ?? '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const providerId = user?.providerData[0]?.providerId;
  const provider = providerId === 'google.com' ? 'Google' : providerId === 'apple.com' ? 'Apple' : 'Email';

  const settings: SettingRow[] = [
    {
      icon: 'notifications-outline', label: 'Notificaciones', onPress: handleNotifications, tint: colors.vivid[2],
      value: notifStatus === 'granted' ? 'Activadas' : notifStatus === 'denied' ? 'Bloqueadas' : 'Activar',
      valueTone: notifStatus === 'granted' ? 'ok' : 'warn',
    },
    { icon: 'wallet-outline', label: 'Presupuesto mensual', value: moneyShort(budget), onPress: () => setBudgetOpen(true), tint: colors.vivid[0] },
    { icon: 'cash-outline', label: 'Moneda', value: 'MXN', tint: colors.vivid[3] },
    { icon: 'contrast-outline', label: 'Apariencia', value: dark ? 'Oscura (sistema)' : 'Clara (sistema)', tint: colors.vivid[5] },
    { icon: 'cloud-done-outline', label: 'Sincronización', value: 'Firebase', tint: colors.vivid[4] },
    { icon: 'log-out-outline', label: 'Cerrar sesión', onPress: handleSignOut, danger: true },
  ];

  return (
    <View style={s.root}>
      <ScreenBackground scene="profile" />
      <BudgetModal visible={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <TopBar scrollY={scrollY} title="Perfil" />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + TOP_BAR_H - 12, paddingBottom: bottom }}
      >
        <LargeTitle scrollY={scrollY} title="Perfil" />
        {/* Tarjeta de usuario */}
        <Animated.View entering={enter(0)} style={[s.userCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
            {user?.photoURL
              ? <Image source={{ uri: user.photoURL }} style={[s.avatar, { borderColor: colors.bg }]} />
              : <View style={[s.avatar, s.avatarFallback, { borderColor: colors.bg, backgroundColor: colors.bg }]}>
                  <Text style={[s.initials, { color: colors.vivid[0] }]}>{initials}</Text>
                </View>}
          </LinearGradient>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[type.h2, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
            {!!email && <Text style={[s.email, { color: colors.subtext }]} numberOfLines={1}>{email}</Text>}
            <View style={[s.provider, { backgroundColor: badgeBg(colors.vivid[0], colors.accentSoft) }]}>
              <Ionicons name={provider === 'Apple' ? 'logo-apple' : provider === 'Google' ? 'logo-google' : 'mail'} size={11} color={colors.vivid[0]} />
              <Text style={[s.providerText, { color: colors.vivid[0] }]}>{provider}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={enter(1)} style={s.stats}>
          {[
            { value: String(subscriptions.length), label: 'Activas', icon: 'apps' as IoniconName },
            { value: moneyShort(monthlyTotal), label: 'Al mes', icon: 'calendar' as IoniconName },
            { value: moneyShort(yearlyTotal), label: 'Al año', icon: 'trending-up' as IoniconName },
          ].map((st, i) => (
            <View key={st.label} style={[s.stat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Ionicons name={st.icon} size={16} color={colors.vivid[[0, 4, 1][i]]} />
              <Text style={[s.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{st.value}</Text>
              <Text style={[s.statLabel, { color: colors.subtext }]}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Tarjetas */}
        <SectionHeader
          title="Mis tarjetas"
          action={cards.length > 1 ? (editingCards ? 'Listo' : 'Editar') : undefined}
          onAction={() => setEditingCards(v => !v)}
        />
        <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {sortedCards.map((card, i) => {
            const isClabe = card.kind === 'clabe';
            return (
              <View key={card.id} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
                {editingCards && (
                  <View>
                    <Pressable onPress={() => moveCard(i, -1)} disabled={i === 0} style={{ opacity: i === 0 ? 0.25 : 1 }} hitSlop={6}>
                      <Ionicons name="chevron-up" size={18} color={colors.accent} />
                    </Pressable>
                    <Pressable onPress={() => moveCard(i, 1)} disabled={i === sortedCards.length - 1} style={{ opacity: i === sortedCards.length - 1 ? 0.25 : 1 }} hitSlop={6}>
                      <Ionicons name="chevron-down" size={18} color={colors.accent} />
                    </Pressable>
                  </View>
                )}
                <View style={[s.rowIcon, { backgroundColor: isClabe ? badgeBg(colors.vivid[0], colors.accentSoft) : brandIconBg(card.brand, dark) }]}>
                  {isClabe ? <Ionicons name="swap-horizontal" size={18} color={colors.vivid[0]} /> : <BrandSvgIcon brand={card.brand} size={24} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyBold, { color: colors.text }]} numberOfLines={1}>{card.alias}</Text>
                  <Text style={[s.rowSub, { color: isClabe ? colors.vivid[0] : colors.subtext }]} numberOfLines={1}>
                    {isClabe && card.clabe ? card.clabe.replace(/(\d{4})(?=\d)/g, '$1 ') : card.bank}
                  </Text>
                </View>
                {editingCards ? (
                  <Pressable hitSlop={8} onPress={() => Alert.alert('Eliminar', `¿Eliminar "${card.alias}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => removeCard(card.id) },
                  ])}>
                    <Ionicons name="trash-outline" size={20} color={colors.urgent} />
                  </Pressable>
                ) : isClabe && card.clabe ? (
                  <Pressable onPress={() => copyClabe(card.clabe!)} hitSlop={8} style={[s.copy, { backgroundColor: badgeBg(colors.vivid[0], colors.accentSoft) }]}>
                    <Ionicons name="copy-outline" size={14} color={colors.vivid[0]} />
                    <Text style={[s.copyText, { color: colors.vivid[0] }]}>Copiar</Text>
                  </Pressable>
                ) : (
                  <CardChip card={card} colors={colors} />
                )}
              </View>
            );
          })}
          {!editingCards && (
            <Pressable
              onPress={() => setShowCardModal(true)}
              style={[s.row, cards.length > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}
            >
              <View style={[s.rowIcon, { backgroundColor: badgeBg(colors.vivid[0], colors.accentSoft) }]}>
                <Ionicons name="add" size={20} color={colors.vivid[0]} />
              </View>
              <Text style={[type.bodyBold, { color: colors.vivid[0], flex: 1 }]}>
                {cards.length === 0 ? 'Agregar tarjeta o CLABE' : 'Agregar otra'}
              </Text>
            </Pressable>
          )}
        </View>
        <CardPickerModal visible={showCardModal} onSelect={() => {}} onClose={() => setShowCardModal(false)} />

        {/* Ajustes estilo lista */}
        <SectionHeader title="Ajustes" />
        <View style={{ gap: 10, marginHorizontal: spacing.screen }}>
          {settings.map(row => {
            const iconTint = row.danger ? colors.urgent : row.tint ?? colors.text;
            return (
              <Pressable
                key={row.label}
                onPress={row.onPress}
                disabled={!row.onPress}
                style={({ pressed }) => [s.setting, { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <View style={[s.settingIcon, { backgroundColor: badgeBg(iconTint, colors.accentSoft) }]}>
                  <Ionicons name={row.icon} size={19} color={iconTint} />
                </View>
                <Text style={[s.settingLabel, { color: row.danger ? colors.urgent : colors.text }]}>{row.label}</Text>
                {row.value && (
                  <Text style={[s.settingValue, {
                    color: row.valueTone === 'ok' ? colors.success : row.valueTone === 'warn' ? colors.warning : colors.subtext,
                  }]}>{row.value}</Text>
                )}
                {row.onPress && !row.danger && <Ionicons name="chevron-forward" size={18} color={colors.subtext} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.version, { color: colors.muted }]}>Subly v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: spacing.screen, borderRadius: radius.lg, padding: 16 , borderWidth: StyleSheet.hairlineWidth },
  avatarRing: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 24, fontWeight: '900' },
  email: { fontSize: 13, fontWeight: '400' },
  provider: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs, marginTop: 4 },
  providerText: { fontSize: 11, fontWeight: '600' },

  stats: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 12 },
  stat: { flex: 1, borderRadius: radius.md, padding: 14, gap: 4 , borderWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  list: { marginHorizontal: spacing.screen, borderRadius: radius.lg, overflow: 'hidden' , borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  copyText: { fontSize: 12, fontWeight: '700' },

  setting: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14 , borderWidth: StyleSheet.hairlineWidth },
  settingIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  settingValue: { fontSize: 13, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, fontWeight: '500', marginTop: 24 },
});
