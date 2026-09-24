import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC93XLkISzPfGHbLXYckzfs6M-B0i28uxk',
  authDomain: 'subly-cfd2c.firebaseapp.com',
  projectId: 'subly-cfd2c',
  storageBucket: 'subly-cfd2c.firebasestorage.app',
  messagingSenderId: '615750218210',
  appId: '1:615750218210:web:f5d3cd0ff669bab2de89bb',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app);
export default app;
