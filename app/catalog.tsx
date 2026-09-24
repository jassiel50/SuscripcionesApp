import React from 'react';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import CatalogBrowser from '../src/components/CatalogBrowser';
import { StackHeader } from '../src/components/ui';
import { catalogPlanHref } from '../src/utils/catalog';

/** Explorar catálogo (antes pestaña "Explorar"; ahora se abre desde Inicio). */
export default function CatalogScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  return (
    <>
      <CatalogBrowser
        bottomInset={40}
        scrollY={scrollY}
        onSelectPlan={(sub, plan) => router.push(catalogPlanHref(sub, plan))}
      />
      <StackHeader title="Explorar catálogo" onBack={() => router.back()} scrollY={scrollY} />
    </>
  );
}
