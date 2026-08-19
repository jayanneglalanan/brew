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
const LOGO_IMAGE_KEY = 'kapeflow.logoImage';
const LOGO_TEXT_KEY = 'kapeflow.logoText';
const LOGO_COLOR_KEY = 'kapeflow.logoColor';
const VERSION = 2;

export const DEFAULT_SHOP_NAME = 'KapeFlow Coffee';
export const DEFAULT_BUSINESS_HOURS = '7:00 AM – 9:00 PM';
export const DEFAULT_LOGO_TEXT = 'KF';
export const DEFAULT_LOGO_COLOR = '#8B6F5A';

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

export function loadLogoImage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LOGO_IMAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLogoImage(image: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOGO_IMAGE_KEY, image);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function loadLogoText(): string {
  if (typeof window === 'undefined') return DEFAULT_LOGO_TEXT;
  try {
    return window.localStorage.getItem(LOGO_TEXT_KEY) || DEFAULT_LOGO_TEXT;
  } catch {
    return DEFAULT_LOGO_TEXT;
  }
}

export function saveLogoText(text: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOGO_TEXT_KEY, text.trim() || DEFAULT_LOGO_TEXT);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function loadLogoColor(): string {
  if (typeof window === 'undefined') return DEFAULT_LOGO_COLOR;
  try {
    return window.localStorage.getItem(LOGO_COLOR_KEY) || DEFAULT_LOGO_COLOR;
  } catch {
    return DEFAULT_LOGO_COLOR;
  }
}

export function saveLogoColor(color: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOGO_COLOR_KEY, color);
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