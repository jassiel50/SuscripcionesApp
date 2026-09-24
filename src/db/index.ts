import * as SQLite from 'expo-sqlite';
import type { NewSubscription, Subscription } from '../types';

const DB_NAME = 'suscripciones.db';

// Abre la DB de forma síncrona (seguro fuera del render)
export const db = SQLite.openDatabaseSync(DB_NAME);

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS subscriptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      price           REAL    NOT NULL,
      billing_cycle   TEXT    NOT NULL DEFAULT 'monthly',
      next_renewal    TEXT    NOT NULL,
      category        TEXT    NOT NULL DEFAULT 'other',
      color           TEXT    NOT NULL DEFAULT '#007AFF',
      remind_me       INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT,
      payment_method  TEXT    NOT NULL DEFAULT 'other',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Migration: add payment_method if missing (safe on existing DBs)
  try {
    db.execSync(`ALTER TABLE subscriptions ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'other';`);
  } catch { /* column already exists */ }
}

// ── CRUD ──────────────────────────────────────────────────

export function getAllSubscriptions(): Subscription[] {
  return db.getAllSync<Subscription>(
    'SELECT * FROM subscriptions ORDER BY next_renewal ASC'
  );
}

export function getSubscriptionById(id: number): Subscription | null {
  return db.getFirstSync<Subscription>(
    'SELECT * FROM subscriptions WHERE id = ?',
    [id]
  ) ?? null;
}

export function insertSubscription(sub: NewSubscription): number {
  const result = db.runSync(
    `INSERT INTO subscriptions
       (name, price, billing_cycle, next_renewal, category, color, remind_me, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sub.name, sub.price, sub.billing_cycle, sub.next_renewal, sub.category, sub.color, sub.remind_me, sub.payment_method ?? 'other']
  );
  return result.lastInsertRowId;
}

export function updateSubscription(id: number, sub: Partial<NewSubscription>) {
  const fields = Object.keys(sub).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(sub), id];
  db.runSync(`UPDATE subscriptions SET ${fields} WHERE id = ?`, values);
}

export function updateNotificationId(id: number, notificationId: string | null) {
  db.runSync(
    'UPDATE subscriptions SET notification_id = ? WHERE id = ?',
    [notificationId, id]
  );
}

export function deleteSubscription(id: number) {
  db.runSync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

export function getMonthlyTotal(): number {
  const rows = db.getAllSync<{ price: number; billing_cycle: string }>(
    'SELECT price, billing_cycle FROM subscriptions'
  );
  return rows.reduce((sum, row) => {
    const monthly = row.billing_cycle === 'yearly' ? row.price / 12 : row.price;
    return sum + monthly;
  }, 0);
}

export function getSubscriptionsDueIn(days: number): Subscription[] {
  return db.getAllSync<Subscription>(
    `SELECT * FROM subscriptions
     WHERE julianday(next_renewal) - julianday('now') BETWEEN 0 AND ?
     ORDER BY next_renewal ASC`,
    [days]
  );
}

// Seed de ejemplo (solo si la tabla está vacía)
export function seedIfEmpty() {
  const count = db.getFirstSync<{ n: number }>('SELECT COUNT(*) as n FROM subscriptions')?.n ?? 0;
  if (count > 0) return;

  const seeds: NewSubscription[] = [
    { name: 'Netflix',      price: 15.99, billing_cycle: 'monthly', next_renewal: '2026-06-01', category: 'entertainment', color: '#E50914', remind_me: 1, payment_method: 'credit_card' },
    { name: 'Spotify',      price: 9.99,  billing_cycle: 'monthly', next_renewal: '2026-06-15', category: 'entertainment', color: '#1DB954', remind_me: 1, payment_method: 'credit_card' },
    { name: 'Apple iCloud', price: 2.99,  billing_cycle: 'monthly', next_renewal: '2026-06-28', category: 'productivity',  color: '#3478F6', remind_me: 0, payment_method: 'credit_card' },
  ];
  seeds.forEach(s => insertSubscription(s));
}
