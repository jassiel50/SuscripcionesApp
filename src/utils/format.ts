/**
 * Formateo de dinero centralizado. La app trabaja en MXN (el catálogo está en
 * pesos). Si en el futuro se agrega multi-moneda, sólo cambia aquí.
 */
export const CURRENCY = 'MXN';

const fmt2 = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmt0 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

/** $1,234.50 */
export function money(n: number): string {
  return `$${fmt2.format(Number.isFinite(n) ? n : 0)}`;
}

/** $1,235 — para cifras grandes/resumidas. */
export function moneyShort(n: number): string {
  return `$${fmt0.format(Number.isFinite(n) ? Math.round(n) : 0)}`;
}

/** Separa entero y centavos para mostrarlos con tamaños distintos en héroes. */
export function moneyParts(n: number): { int: string; dec: string } {
  const [int, dec = '00'] = fmt2.format(Number.isFinite(n) ? n : 0).split('.');
  return { int: `$${int}`, dec };
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
