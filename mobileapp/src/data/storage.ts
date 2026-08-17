import AsyncStorage from '@react-native-async-storage/async-storage';
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

export async function loadShopName(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(SHOP_NAME_KEY);
    return raw || DEFAULT_SHOP_NAME;
  } catch {
    return DEFAULT_SHOP_NAME;
  }
}

export async function saveShopName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOP_NAME_KEY, name.trim() || DEFAULT_SHOP_NAME);
  } catch {
    // Ignore quota / storage errors.
  }
}

export async function loadBusinessHours(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(BUSINESS_HOURS_KEY);
    return raw || DEFAULT_BUSINESS_HOURS;
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
}

export async function saveBusinessHours(hours: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BUSINESS_HOURS_KEY, hours.trim() || DEFAULT_BUSINESS_HOURS);
  } catch {
    // Ignore quota / storage errors.
  }
}

export async function loadSnapshot(): Promise<DataSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataSnapshot;
    return parsed.version === VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSnapshot(snapshot: DataSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota / storage errors.
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}