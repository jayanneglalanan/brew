import type { AuditLog } from '../types/staff';
import type { StockMovementEntry } from '../types/inventory';
import type { Transaction } from '../types/transaction';

export interface SeedFingerprint {
  transactions: Transaction[];
  stockMovements: StockMovementEntry[];
  auditLogs: AuditLog[];
}

export function seedSignature(seed: SeedFingerprint): string {
  const lastTx = seed.transactions[seed.transactions.length - 1];
  return [
    seed.transactions.length,
    lastTx?.orderNumber ?? '',
    lastTx?.timestamp ?? '',
    seed.stockMovements.length,
    seed.auditLogs.length,
  ].join(':');
}