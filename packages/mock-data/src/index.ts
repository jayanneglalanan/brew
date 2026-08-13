import categoriesRaw from './data/categories.json';
import productsRaw from './data/products.json';
import inventoryRaw from './data/inventory.json';
import transactionsRaw from './data/transactions.json';
import expensesRaw from './data/expenses.json';
import staffRaw from './data/staff.json';
import auditLogsRaw from './data/audit-logs.json';
import stockMovementsRaw from './data/stock-movements.json';

import type { Category } from './types/product';
import type { Product } from './types/product';
import type { InventoryItem, StockMovementEntry } from './types/inventory';
import type { Transaction } from './types/transaction';
import type { Expense } from './types/expense';
import type { Staff, AuditLog } from './types/staff';

export const categories = categoriesRaw as unknown as Category[];
export const products = productsRaw as unknown as Product[];
export const inventory = inventoryRaw as unknown as InventoryItem[];
export const transactions = transactionsRaw as unknown as Transaction[];
export const expenses = expensesRaw as unknown as Expense[];
export const staff = staffRaw as unknown as Staff[];
export const auditLogs = auditLogsRaw as unknown as AuditLog[];
export const stockMovements = stockMovementsRaw as unknown as StockMovementEntry[];

export * from './types/report';
export * from './types/product';
export * from './types/inventory';
export * from './types/transaction';
export * from './types/expense';
export * from './types/staff';
export * from './lib/currencies';
export * from './lib/dates';
export * from './lib/calculations';
export * from './lib/analytics';
export * from './lib/persistence';
