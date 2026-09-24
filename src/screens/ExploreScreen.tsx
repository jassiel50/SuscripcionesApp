import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface Props { onAdd: () => void }

const CATEGORY_CHIPS = ['Todo', 'Streaming', 'Productividad', 'Nube', 'Salud', 'Juegos'];

const FEATURED = [
  { id: 'n',  name: 'Netflix',  price: 'Desde $6.99/mes',  bg: '#E50914', letter: 'N', category: 'Streaming',  rating: '4.8' },
  { id: 's',  name: 'Spotify',  price: 'Desde $10.99/mes', bg: '#1DB954', letter: 'S', category: 'Streaming',  rating: '4.9' },
  { id: 'no', name: 'Notion',   price: 'Plan gratuito',    bg: '#191919', letter: 'N', category: 'Productividad', rating: '4.7' },
  { id: 'd',  name: 'Dropbox',  price: 'Desde $11.99/mes', bg: '#3B8BEB', letter: 'D', category: 'Nube',        rating: '4.5' },
  { id: 'p',  name: 'Peloton',  price: 'Desde $12.99/mes', bg: '#1B2030', letter: 'P', category: 'Salud',       rating: '4.6' },
  { id: 'c',  name: 'Calm',     price: '$69.99/año',        bg: '#6B7EBF', letter: 'C', category: 'Salud',       rating: '4.8' },
  { id: 'xb', name: 'Xbox',     price: 'Desde $9.99/mes',  bg: '#107C10', letter: 'X', category: 'Juegos',      rating: '4.7' },
  { id: 'ap', name: 'Arcade',   price: '$6.99/mes',         bg: '#555',    letter: 'A', category: 'Juegos',      rating: '4.4' },
  { id: 'ic', name: 'iCloud+',  price: 'Desde $0.99/mes',  bg: '#3478F6', letter: 'i', category: 'Nube',        rating: '4.6' },
];

export default function ExploreScreen({ onAdd }: Props) {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [search, setSearch] = useState('');

  const visible = FEATURED.filter(item => {
    const matchCat = activeCategory === 'Todo' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.headerSub, { color: colors.subtext }]}>Descubre nuevos servicios</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>Explorar</Text>
        </View>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.accent }]} onPress={onAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[s.searchBar, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Ionicons name="search" size={16} color={colors.subtext} />
        <TextInput
          placeholder="Buscar servicios..."
          placeholderTextColor={colors.subtext}
          style={[s.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipsRow}
      >
        {CATEGORY_CHIPS.map(c => {
          const active = c === activeCategory;
          return (
            <TouchableOpacity
              key={c}
              style={[
                s.chip,
                active
                  ? { backgroundColor: colors.accent }
                  : { backgroundColor: colors.card },
              ]}
              onPress={() => setActiveCategory(c)}
            >
              <Text style={[s.chipText, { color: active ? '#fff' : colors.subtext }]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={[s.resultsLabel, { color: colors.subtext }]}>
          {visible.length} resultado{visible.length !== 1 ? 's' : ''}
        </Text>

        {visible.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            activeOpacity={0.75}
          >
            <View style={[s.cardAvatar, { backgroundColor: item.bg }]}>
              <Text style={s.cardLetter}>{item.letter}</Text>
            </View>

            <View style={s.cardInfo}>
              <Text style={[s.cardName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[s.cardCategory, { color: colors.subtext }]}>{item.category}</Text>
              <View style={s.cardMeta}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={[s.cardRating, { color: colors.subtext }]}>{item.rating}</Text>
                <Text style={[s.cardPrice, { color: colors.accent }]}> · {item.price}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: colors.accentSoft }]}
              onPress={onAdd}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[s.addBtnText, { color: colors.accent }]}>Agregar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {visible.length === 0 && (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="search-outline" size={32} color={colors.accent} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Sin resultados</Text>
            <Text style={[s.emptyDesc, { color: colors.subtext }]}>
              Prueba con otra búsqueda o categoría.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSub: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipsRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
    elevation: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  resultsLabel: { fontSize: 12, fontWeight: '500', marginTop: 8, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAvatar: {
    width: 50, height: 50, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardLetter: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardCategory: { fontSize: 12 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  cardRating: { fontSize: 12 },
  cardPrice: { fontSize: 12, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
