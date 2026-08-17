export type StockStatus = 'good' | 'low' | 'critical';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  criticalLevel: number;
  costPerUnit: number;
  category: string;
  supplier?: string;
  expirationDate?: string;
}

export interface StockMovementEntry {
  id: string;
  itemId: string;
  type: 'purchase' | 'sale' | 'wastage' | 'adjustment' | 'damaged';
  qty: number | string;
  timestamp: string;
  note?: string;
}
