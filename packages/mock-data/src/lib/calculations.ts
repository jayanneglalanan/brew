import type { Transaction } from '../types/transaction';
import type { Product } from '../types/product';

export function transactionSubtotal(tx: Transaction): number {
  return tx.items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

export function transactionNet(tx: Transaction): number {
  return transactionSubtotal(tx) - tx.discount;
}

export function transactionItemsCount(tx: Transaction): number {
  return tx.items.reduce((sum, it) => sum + it.qty, 0);
}

export function transactionCogs(tx: Transaction, productsById: Map<string, Product>): number {
  return tx.items.reduce((sum, it) => {
    const p = productsById.get(it.productId);
    return sum + (p ? p.cost * it.qty : 0);
  }, 0);
}

export function transactionProfit(tx: Transaction, productsById: Map<string, Product>): number {
  return transactionNet(tx) - transactionCogs(tx, productsById);
}

export function margin(cost: number, price: number): number {
  if (price <= 0) return 0;
  return (price - cost) / price;
}
