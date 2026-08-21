export type ExpenseCategory = 'rent' | 'utilities' | 'supplies' | 'payroll' | 'maintenance' | 'marketing' | 'other';

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  timestamp: string;
  recurring?: boolean;
  description?: string;
  receiptImage?: string;
}
