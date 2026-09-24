import React, { useState } from 'react';
import {
  Alert, Image, Platform, ScrollView, StyleSheet, Switch,
  Text, ToastAndroid, TouchableOpacity, View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { isExpoGo } from '../../src/utils/env';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/firebase';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscriptions } from '../../src/hooks/useSubscriptions';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentCards } from '../../src/hooks/usePaymentCards';
import CardPickerModal, { CardChip, BrandSvgIcon, brandIconBg } from '../../src/components/CardPickerModal';

export default function ProfileScreen() {
  const { subscriptions, monthlyTotal } = useSubscriptions();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const { cards, removeCard, updateCard } = usePaymentCards();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCards, setEditingCards] = useState(false);

  const sortedCards = [...cards].sort((a, b) => {
    const ao = a.order ?? 999, bo = b.order ?? 999;
    if (ao !== bo) return ao - bo;
    return a.created_at.localeCompare(b.created_at);
  });

  const moveCard = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sortedCards.length) return;
    const a = sortedCards[index];
    const b = sortedCards[target];
    await updateCard(a.id, { order: target });
    await updateCard(b.id, { order: index });
  };

  const yearlyTotal = monthlyTotal * 12;

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut(auth);
          },
        },
      ],
    );
  };

  const displayName = user?.displayName ?? 'Usuario';
  const email = user?.email ?? '';
  const photoURL = user?.photoURL;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const provider = user?.providerData[0]?.providerId === 'google.com' ? 'Google' :
                   user?.providerData[0]?.providerId === 'apple.com' ? 'Apple' : 'OAuth';

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isExpoGo ? insets.bottom + 90 : 32 }}
      >
        {/* ── Dark hero header ── */}
        <LinearGradient
          colors={dark ? ['#1E293B', '#0F172A'] : ['#111827', '#374151']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroGrad}
        >
          <View style={s.heroDec1} />
          <View style={s.heroDec2} />

          {photoURL ? (
            <Image source={{ uri: photoURL }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={s.heroName}>{displayName}</Text>
          <Text style={s.heroEmail}>{email}</Text>
          <View style={s.providerPill}>
            <Text style={s.providerText}>via {provider}</Text>
          </View>
        </LinearGradient>

        {/* ── Stats strip ── */}
        <View style={[s.statsStrip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {[
            { value: String(subscriptions.length), label: 'Activas' },
            { value: `$${monthlyTotal.toFixed(0)}`, label: 'Al mes' },
            { value: `$${yearlyTotal.toFixed(0)}`, label: 'Al año' },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={s.statItem}>
                <Text style={[s.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: colors.subtext }]}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[s.statDivider, { backgroundColor: colors.separator }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Mis tarjetas ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Mis tarjetas</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {cards.length > 1 && (
              <TouchableOpacity onPress={() => setEditingCards(v => !v)}>
                <Text style={[s.sectionLink, { color: editingCards ? colors.urgent : colors.accent }]}>
                  {editingCards ? 'Listo' : 'Ordenar'}
                </Text>
              </TouchableOpacity>
            )}
            {!editingCards && (
              <TouchableOpacity onPress={() => setShowCardModal(true)}>
                <Text style={[s.sectionLink, { color: colors.accent }]}>+ Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {cards.length === 0 ? (
          <TouchableOpacity
            style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setShowCardModal(true)}
            activeOpacity={0.7}
          >
            <View style={s.row}>
              <View style={[s.rowIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="card-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[s.rowLabel, { color: colors.subtext }]}>Agregar tarjeta o CLABE</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {sortedCards.map((card, i) => {
              const isClabe = card.kind === 'clabe';
              return (
                <View key={card.id}>
                  {i > 0 && <View style={[s.sep, { backgroundColor: colors.separator }]} />}
                  <View style={s.cardRow}>
                    {editingCards && (
                      <View style={s.reorderCol}>
                        <TouchableOpacity onPress={() => moveCard(i, -1)} disabled={i === 0} style={{ opacity: i === 0 ? 0.2 : 1 }}>
                          <Ionicons name="chevron-up" size={18} color={colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveCard(i, 1)} disabled={i === sortedCards.length - 1} style={{ opacity: i === sortedCards.length - 1 ? 0.2 : 1 }}>
                          <Ionicons name="chevron-down" size={18} color={colors.accent} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={[s.cardIconWrap, { backgroundColor: isClabe ? colors.accentSoft : brandIconBg(card.brand, dark) }]}>
                      {isClabe
                        ? <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} />
                        : <BrandSvgIcon brand={card.brand} size={24} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardAlias, { color: colors.text }]}>{card.alias}</Text>
                      {isClabe && card.clabe ? (
                        <Text style={[s.cardSub, { color: colors.accent }]}>{card.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</Text>
                      ) : (
                        <Text style={[s.cardSub, { color: colors.subtext }]}>{card.bank}</Text>
                      )}
                    </View>
                    {editingCards ? (
                      <TouchableOpacity
                        onPress={() => Alert.alert('Eliminar', `¿Eliminar "${card.alias}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => removeCard(card.id) },
                        ])}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.urgent} />
                      </TouchableOpacity>
                    ) : isClabe && card.clabe ? (
                      <TouchableOpacity
                        style={[s.copyBtn, { backgroundColor: colors.accentSoft }]}
                        onPress={async () => {
                          await Clipboard.setStringAsync(card.clabe!);
                          if (Platform.OS === 'android') ToastAndroid.show('CLABE copiada', ToastAndroid.SHORT);
                          else Alert.alert('Copiada', 'CLABE copiada al portapapeles');
                        }}
                      >
                        <Ionicons name="copy-outline" size={14} color={colors.accent} />
                        <Text style={[s.copyText, { color: colors.accent }]}>Copiar</Text>
                      </TouchableOpacity>
                    ) : (
                      <CardChip card={card} colors={colors} />
                    )}
                  </View>
                </View>
              );
            })}
            {!editingCards && (
              <>
                <View style={[s.sep, { backgroundColor: colors.separator }]} />
                <TouchableOpacity style={s.row} onPress={() => setShowCardModal(true)} activeOpacity={0.7}>
                  <View style={[s.rowIconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="add" size={18} color={colors.accent} />
                  </View>
                  <Text style={[s.rowLabel, { color: colors.accent }]}>Agregar otra tarjeta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <CardPickerModal
          visible={showCardModal}
          onSelect={() => {}}
          onClose={() => setShowCardModal(false)}
        />

        {/* ── Ajustes ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Ajustes</Text>
        </View>
        <View style={s.settingsCol}>
          <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.rowIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="notifications-outline" size={18} color="#D97706" />
            </View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Notificaciones</Text>
            <Switch
              value
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#fff"
              ios_backgroundColor={colors.separator}
            />
          </View>

          <TouchableOpacity style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}>
            <View style={[s.rowIconWrap, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="cash-outline" size={18} color="#7C3AED" />
            </View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Moneda</Text>
            <View style={[s.settingValue, { backgroundColor: colors.bg }]}>
              <Text style={[s.settingValueText, { color: colors.subtext }]}>USD</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}>
            <View style={[s.rowIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="alarm-outline" size={18} color="#16A34A" />
            </View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Recordatorio</Text>
            <View style={[s.settingValue, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[s.settingValueText, { color: '#16A34A' }]}>1 día antes</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* ── Cuenta ── */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Cuenta</Text>
        </View>
        <View style={s.settingsCol}>
          <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.rowIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="cloud-done-outline" size={18} color="#2563EB" />
            </View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Datos guardados en</Text>
            <View style={[s.settingValue, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[s.settingValueText, { color: '#2563EB' }]}>Firebase</Text>
            </View>
          </View>

          <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[s.rowIconWrap, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}>
              <Ionicons name="person-outline" size={18} color={colors.subtext} />
            </View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Sesión con</Text>
            <View style={[s.settingValue, { backgroundColor: colors.bg }]}>
              <Text style={[s.settingValueText, { color: colors.subtext }]}>{provider}</Text>
            </View>
          </View>
        </View>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity
          style={[s.signOutBtn, { backgroundColor: colors.primary }]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.primaryText} />
          <Text style={[s.signOutText, { color: colors.primaryText }]}>
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: colors.subtext }]}>Subly v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  heroGrad: {
    paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20,
    alignItems: 'center', gap: 6, overflow: 'hidden',
  },
  heroDec1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -100, right: -80,
  },
  heroDec2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: -50, left: 10,
  },
  avatarImg: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarFallback: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { fontSize: 30, fontWeight: '700', color: '#fff' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  providerPill: {
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  providerText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  statsStrip: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: -1,
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginTop: 28, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sectionLink: { fontSize: 14, fontWeight: '600' },

  listCard: {
    marginHorizontal: 16, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 64 },

  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  reorderCol: { alignItems: 'center' },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardAlias: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  copyText: { fontSize: 12, fontWeight: '600' },

  settingsCol: { marginHorizontal: 16, gap: 10 },
  settingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  settingValue: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  settingValueText: { fontSize: 12, fontWeight: '600' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 28, borderRadius: 20,
    paddingVertical: 16, gap: 8,
  },
  signOutText: { fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 16, marginBottom: 8 },
});
