import { useColorScheme } from 'react-native';

const LIGHT = {
  bg:          '#F4F6FA',
  card:        '#FFFFFF',
  cardBorder:  'rgba(0,0,0,0.07)',
  text:        '#0F172A',
  subtext:     '#64748B',
  accent:      '#2563EB',
  accentSoft:  '#EFF6FF',
  urgent:      '#EF4444',
  separator:   '#E2E8F0',
  tabBar:      '#FFFFFF',
  shadow:      '#000000',
  primary:     '#111827',
  primaryText: '#FFFFFF',
};

const DARK = {
  bg:          '#0F172A',
  card:        '#1E293B',
  cardBorder:  'rgba(255,255,255,0.08)',
  text:        '#F1F5F9',
  subtext:     '#94A3B8',
  accent:      '#3B82F6',
  accentSoft:  '#1E3560',
  urgent:      '#F87171',
  separator:   '#334155',
  tabBar:      '#1E293B',
  shadow:      '#000000',
  primary:     '#F1F5F9',
  primaryText: '#111827',
};

export type ThemeColors = typeof LIGHT;

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { dark, colors: dark ? DARK : LIGHT };
}
