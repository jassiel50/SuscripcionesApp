import type { Href } from 'expo-router';
import type { Category } from '../types';
import type { Plan, PredefinedSubscription, ServiceCategory } from '../../constants/subscriptions';

/** Mapea la categoría del catálogo a la categoría interna de la app. */
export function mapCategory(cat: ServiceCategory): Category {
  const m: Record<ServiceCategory, Category> = {
    Streaming: 'entertainment', Música: 'entertainment', Gaming: 'entertainment',
    Almacenamiento: 'productivity', Productividad: 'productivity', IA: 'productivity',
    Educación: 'education',
  };
  return m[cat] ?? 'other';
}

/**
 * Precio a guardar según el periodo del plan: los planes anuales se guardan
 * con su precio anual y ciclo 'yearly' (antes se guardaba el equivalente
 * mensual como si fuera anual y el gasto salía 12× más bajo).
 */
export function planPrice(plan: Plan): number {
  return plan.periodo === 'anual' ? plan.precio : plan.precioMensual;
}

export function catalogPlanHref(sub: PredefinedSubscription, plan: Plan): Href {
  return `/subscription/new?catalogId=${sub.id}&planName=${encodeURIComponent(plan.nombre)}&planPrice=${planPrice(plan)}&planPeriod=${plan.periodo}` as Href;
}
