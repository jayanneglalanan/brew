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

export function loadSnapshot(): DataSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataSnapshot;
    return parsed.version === 1 ? parsed : null;
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