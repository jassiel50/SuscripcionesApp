import React from 'react';
import { useRouter } from 'expo-router';
import CatalogBrowser from '../src/components/CatalogBrowser';
import { catalogPlanHref } from '../src/utils/catalog';

/** Explorar catálogo (antes pestaña "Explorar"; ahora se abre desde Inicio). */
export default function CatalogScreen() {
  const router = useRouter();
  return (
    <CatalogBrowser
      bottomInset={40}
      onSelectPlan={(sub, plan) => router.push(catalogPlanHref(sub, plan))}
    />
  );
}
