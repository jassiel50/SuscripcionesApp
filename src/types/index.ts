export type BillingCycle = 'monthly' | 'yearly';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash' | 'other';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';
export type CardKind  = 'credit' | 'debit' | 'clabe';

export interface PaymentCard {
  id: string;
  alias: string;        // e.g. "Mi Visa BBVA"
  kind: CardKind;       // credit | debit | clabe
  brand: CardBrand;     // visa | mastercard | amex | other ('other' for clabe)
  last_digits: string;  // last 4-6 digits of card, or last 4 of CLABE
  clabe?: string;       // full 18-digit CLABE (only when kind === 'clabe')
  bank: string;         // "BBVA", "Banamex", "Banorte", etc.
  order?: number;       // for user-defined ordering
  created_at: string;
}

export type Category =
  | 'entertainment'
  | 'productivity'
  | 'health'
  | 'education'
  | 'finance'
  | 'other';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  next_renewal: string; // ISO date string YYYY-MM-DD
  category: Category;
  color: string;
  remind_me: number; // 0 | 1
  notification_id: string | null;
  payment_method: PaymentMethod;
  description?: string;
  card_id?: string;     // reference to a PaymentCard id
  created_at: string;
}

export type NewSubscription = Omit<Subscription, 'id' | 'created_at' | 'notification_id'>;

export const CATEGORY_LABELS: Record<Category, string> = {
  entertainment: 'Entretenimiento',
  productivity: 'Productividad',
  health: 'Salud',
  education: 'Educación',
  finance: 'Finanzas',
  other: 'Otro',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  entertainment: '#EF4444',
  productivity: '#3B82F6',
  health: '#10B981',
  education: '#8B5CF6',
  finance: '#F59E0B',
  other: '#6B7280',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Tarjeta crédito',
  debit_card: 'Tarjeta débito',
  paypal: 'PayPal',
  bank_transfer: 'Transferencia',
  cash: 'Efectivo',
  other: 'Otro',
};

/** Índice de cada categoría en la paleta vívida del tema (colores de gráficas). */
export const CATEGORY_VIVID_INDEX: Record<Category, number> = {
  productivity: 0,  // índigo
  entertainment: 1, // rosa
  finance: 2,       // ámbar
  health: 3,        // verde
  other: 4,         // cian
  education: 5,     // violeta
};
