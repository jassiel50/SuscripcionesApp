import { useColorScheme } from 'react-native';
import { THEMES, type ThemeColors } from '../theme/tokens';

export type { ThemeColors };

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { dark, colors: dark ? THEMES.dark : THEMES.light };
}
