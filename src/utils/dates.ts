import type { Subscription } from '../types';

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** YYYY-MM-DD en hora LOCAL (toISOString usa UTC y corre el día de noche). */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Parsea YYYY-MM-DD a mediodía local para evitar saltos por zona horaria. */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Mismo día del mes, recortado al último día si el mes es más corto (31 → 30/28). */
function withClampedDay(year: number, month: number, day: number): Date {
  return new Date(year, month, Math.min(day, daysInMonth(year, month)), 12);
}

/**
 * Próxima fecha de cobro REAL a partir de hoy.
 *
 * `next_renewal` guardado en Firestore es la fecha ancla que capturó el usuario;
 * si ya pasó, se avanza por ciclos (mensual/anual) hasta hoy o después. Así la
 * app nunca muestra "Hoy" para un cobro que fue hace 3 meses.
 */
export function nextRenewalDate(sub: Pick<Subscription, 'next_renewal' | 'billing_cycle'>): Date {
  const anchor = parseDate(sub.next_renewal);
  const today = startOfToday();
  if (anchor >= today) return anchor;

  const day = anchor.getDate();
  if (sub.billing_cycle === 'yearly') {
    let y = today.getFullYear();
    let d = withClampedDay(y, anchor.getMonth(), day);
    if (d < today) d = withClampedDay(++y, anchor.getMonth(), day);
    return d;
  }
  let y = today.getFullYear();
  let m = today.getMonth();
  let d = withClampedDay(y, m, day);
  if (d < today) {
    m += 1;
    if (m > 11) { m = 0; y += 1; }
    d = withClampedDay(y, m, day);
  }
  return d;
}

export function nextRenewalStr(sub: Pick<Subscription, 'next_renewal' | 'billing_cycle'>): string {
  return toDateStr(nextRenewalDate(sub));
}

export function daysUntilDate(date: Date): number {
  return Math.round((date.getTime() - startOfToday().getTime()) / 86400000);
}

export function daysUntilRenewal(sub: Pick<Subscription, 'next_renewal' | 'billing_cycle'>): number {
  return daysUntilDate(nextRenewalDate(sub));
}

export function relativeDayLabel(days: number): string {
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days < 7) return `En ${days} días`;
  if (days < 14) return 'En 1 semana';
  return `En ${Math.floor(days / 7)} semanas`;
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function longDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * ¿La suscripción cobra en ese día? Considera recurrencia y recorte de fin de mes.
 * No marca fechas anteriores a la fecha ancla original.
 */
export function chargesOn(sub: Subscription, year: number, month: number, day: number): boolean {
  const anchor = parseDate(sub.next_renewal);
  const target = new Date(year, month, day, 12);
  if (target < anchor) return false;
  if (sub.billing_cycle === 'yearly' && month !== anchor.getMonth()) return false;
  const expected = Math.min(anchor.getDate(), daysInMonth(year, month));
  return day === expected;
}

export function subsOnDate(subs: Subscription[], year: number, month: number, day: number): Subscription[] {
  return subs.filter(s => chargesOn(s, year, month, day));
}

/** Total real a pagar en un mes concreto (mensuales + anuales que caen ese mes). */
export function totalForMonth(subs: Subscription[], year: number, month: number): number {
  let total = 0;
  const last = daysInMonth(year, month);
  for (let d = 1; d <= last; d++) {
    for (const s of subsOnDate(subs, year, month, d)) total += s.price;
  }
  return total;
}

/** Equivalente mensual (anual / 12). */
export function monthlyEquivalent(sub: Pick<Subscription, 'price' | 'billing_cycle'>): number {
  return sub.billing_cycle === 'yearly' ? sub.price / 12 : sub.price;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
