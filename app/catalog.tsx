import React, { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import CatalogBrowser from '../src/components/CatalogBrowser';
import { StackHeader } from '../src/components/ui';
import { catalogPlanHref } from '../src/utils/catalog';

/** Explorar catálogo (antes pestaña "Explorar"; ahora se abre desde Inicio). */
export default function CatalogScreen() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > 24;
    setScrolled(prev => (prev === past ? prev : past));
  };
  return (
    <>
      <CatalogBrowser
        bottomInset={40}
        onScroll={onScroll}
        onSelectPlan={(sub, plan) => router.push(catalogPlanHref(sub, plan))}
      />
      <StackHeader title="Explorar catálogo" onBack={() => router.back()} scrolled={scrolled} />
    </>
  );
}
