import Constants from 'expo-constants';
import { UIManager } from 'react-native';

// SDK 50+ usa executionEnvironment. 'storeClient' = Expo Go.
// Como respaldo: verificamos si el módulo nativo de NativeTabs existe.
const byEnv = (Constants as any).executionEnvironment === 'storeClient';
const byModule = !(UIManager as any).hasViewManagerConfig?.('RNSTabsHostIOS');

export const isExpoGo: boolean = byEnv || byModule;
