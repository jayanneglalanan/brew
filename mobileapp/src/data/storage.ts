import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuditLog, InventoryItem, Product, StockMovementEntry, Transaction } from 'mock-data';

export interface DataSnapshot {
  version: number;
  seedSignature: string;
  products: Product[];
  inventory: InventoryItem[];
  stockMovements: StockMovementEntry[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
}

const KEY = 'kapeflow.state.v1';

export async function loadSnapshot(): Promise<DataSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataSnapshot;
    return parsed.version === 1 ? parsed : null;
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