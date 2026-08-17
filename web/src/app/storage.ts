import type { AuditLog, Category, InventoryItem, Product, StockMovementEntry, Transaction } from 'mock-data';

export interface DataSnapshot {
  version: number;
  seedSignature: string;
  products: Product[];
  inventory: InventoryItem[];
  stockMovements: StockMovementEntry[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  categories: Category[];
}

const KEY = 'kapeflow.state.v1';
const SHOP_NAME_KEY = 'kapeflow.shopName';
const BUSINESS_HOURS_KEY = 'kapeflow.businessHours';
const VERSION = 2;

export const DEFAULT_SHOP_NAME = 'KapeFlow Coffee';
export const DEFAULT_BUSINESS_HOURS = '7:00 AM – 9:00 PM';

export function loadShopName(): string {
  if (typeof window === 'undefined') return DEFAULT_SHOP_NAME;
  try {
    return window.localStorage.getItem(SHOP_NAME_KEY) || DEFAULT_SHOP_NAME;
  } catch {
    return DEFAULT_SHOP_NAME;
  }
}

export function saveShopName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHOP_NAME_KEY, name.trim() || DEFAULT_SHOP_NAME);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function loadBusinessHours(): string {
  if (typeof window === 'undefined') return DEFAULT_BUSINESS_HOURS;
  try {
    return window.localStorage.getItem(BUSINESS_HOURS_KEY) || DEFAULT_BUSINESS_HOURS;
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
}

export function saveBusinessHours(hours: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUSINESS_HOURS_KEY, hours.trim() || DEFAULT_BUSINESS_HOURS);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function loadSnapshot(): DataSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataSnapshot;
    return parsed.version === VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: DataSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}