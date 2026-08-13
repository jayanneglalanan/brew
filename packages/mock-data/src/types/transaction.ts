export type PaymentMethod = 'cash' | 'gcash' | 'card';

export interface TransactionItem {
  productId: string;
  qty: number;
  price: number;
  discount?: number;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  timestamp: string;
  cashierId: string;
  items: TransactionItem[];
  paymentMethod: PaymentMethod;
  discount: number;
  status: 'completed' | 'voided' | 'refunded';
}
