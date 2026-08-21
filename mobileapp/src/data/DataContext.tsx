import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  auditLogs as seedAuditLogs,
  categories as seedCategories,
  expenses as seedExpenses,
  inventory as seedInventory,
  products as seedProducts,
  staff as seedStaff,
  stockMovements as seedMovements,
  transactions as seedTransactions,
  seedSignature,
  type AuditAction,
  type AuditLog,
  type Category,
  type Expense,
  type InventoryItem,
  type PaymentMethod,
  type Product,
  type Staff,
  type StockMovementEntry,
  type Transaction,
  type TransactionItem,
} from 'mock-data';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './storage';
import { loadUser } from './auth';

type MovementInput = {
  type: StockMovementEntry['type'];
  itemId: string;
  qty: number | string;
  note?: string;
  timestamp?: string;
};

type TransactionInput = {
  items: TransactionItem[];
  paymentMethod: PaymentMethod;
  discount?: number;
  cashierId?: string;
  timestamp?: string;
  status?: Transaction['status'];
};

interface DataValue {
  products: Product[];
  inventory: InventoryItem[];
  stockMovements: StockMovementEntry[];
  transactions: Transaction[];
  categories: Category[];
  staff: Staff[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  addCategory: (name: string, icon: string) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  recordMovement: (input: MovementInput) => void;
  recordTransaction: (input: TransactionInput) => Transaction;
  logAudit: (action: AuditAction, target: string, actorId?: string, detail?: string) => void;
  resetData: () => void;
}

const DataContext = createContext<DataValue | null>(null);

const SEED_SIGNATURE = seedSignature({
  transactions: seedTransactions,
  stockMovements: seedMovements,
  auditLogs: seedAuditLogs,
});

function maxNumericSuffix(ids: string[]): number {
  let max = 1000;
  for (const id of ids) {
    const m = /(\d+)$/.exec(id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function maxOrderNumber(txs: Transaction[]): number {
  return txs.reduce((max, t) => {
    const n = parseInt(t.orderNumber.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 1000);
}

let idCounter = maxNumericSuffix([...seedProducts, ...seedMovements, ...seedTransactions, ...seedAuditLogs, ...seedInventory, ...seedCategories].map((x) => x.id));
let orderCounter = maxOrderNumber(seedTransactions);
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;
const nextOrder = () => `KF-${++orderCounter}`;

function syncCounters(products: Product[], movements: StockMovementEntry[], transactions: Transaction[], auditLogs: AuditLog[], inventory: InventoryItem[], categories: Category[], expenses?: Expense[]) {
  idCounter = maxNumericSuffix([...products, ...movements, ...transactions, ...auditLogs, ...inventory, ...categories, ...(expenses ?? [])].map((x) => x.id));
  orderCounter = maxOrderNumber(transactions);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(seedInventory);
  const [movements, setMovements] = useState<StockMovementEntry[]>(seedMovements);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [hydrated, setHydrated] = useState(false);
  const [actorId, setActorId] = useState<string>(seedStaff[0].id);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSnapshot(), loadUser()])
      .then(([snap, user]) => {
        if (cancelled) return;
        if (user) setActorId(user.id);
        if (snap && snap.seedSignature === SEED_SIGNATURE) {
          syncCounters(snap.products, snap.stockMovements, snap.transactions, snap.auditLogs, snap.inventory, snap.categories, snap.expenses);
          setProducts(snap.products);
          setInventory(snap.inventory);
          setMovements(snap.stockMovements);
          setTransactions(snap.transactions);
          setAuditLogs(snap.auditLogs);
          setCategories(snap.categories);
          setExpenses(snap.expenses);
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSnapshot({
      version: 2,
      seedSignature: SEED_SIGNATURE,
      products,
      inventory,
      stockMovements: movements,
      transactions,
      auditLogs,
      categories,
      expenses,
    });
  }, [hydrated, products, inventory, movements, transactions, auditLogs, categories, expenses]);

  const value = useMemo<DataValue>(() => {
    const logAudit = (action: AuditAction, target: string, actorIdOverride?: string, detail?: string) => {
      const entry: AuditLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        actorId: actorIdOverride ?? actorId,
        action,
        target,
        detail,
      };
      setAuditLogs((prev) => [...prev, entry]);
    };

    const recordTransaction = (input: TransactionInput): Transaction => {
      const timestamp = input.timestamp ?? new Date().toISOString();
      const cashierId = input.cashierId ?? seedStaff[0].id;
      const tx: Transaction = {
        id: nextId('txn'),
        orderNumber: nextOrder(),
        timestamp,
        cashierId,
        items: input.items,
        paymentMethod: input.paymentMethod,
        discount: input.discount ?? 0,
        status: input.status ?? 'completed',
      };
      setTransactions((prev) => [...prev, tx]);

      const productsById = new Map(products.map((p) => [p.id, p]));
      setInventory((prev) =>
        prev.map((item) => {
          let consumed = 0;
          for (const it of tx.items) {
            const product = productsById.get(it.productId);
            if (!product) continue;
            for (const ing of product.ingredients) {
              if (ing.ingredientId === item.id) consumed += ing.qty * it.qty;
            }
          }
          return consumed > 0 ? { ...item, currentStock: Math.max(0, item.currentStock - consumed) } : item;
        }),
      );

      setMovements((prev) => {
        const newEntries: StockMovementEntry[] = [];
        const seen = new Set<string>();
        for (const it of tx.items) {
          const product = productsById.get(it.productId);
          if (!product) continue;
          for (const ing of product.ingredients) {
            const amount = ing.qty * it.qty;
            if (seen.has(ing.ingredientId)) continue;
            seen.add(ing.ingredientId);
            newEntries.push({
              id: nextId('mv'),
              itemId: ing.ingredientId,
              type: 'sale',
              qty: -amount,
              timestamp,
              note: tx.orderNumber,
            });
          }
        }
        return [...prev, ...newEntries];
      });

      logAudit('transaction.completed', tx.orderNumber, cashierId, `${tx.items.length} line(s) · ${tx.paymentMethod}`);

      return tx;
    };

    const resetData = async () => {
      await clearSnapshot();
      syncCounters(seedProducts, seedMovements, seedTransactions, seedAuditLogs, seedInventory, seedCategories, seedExpenses);
      setProducts(seedProducts);
      setInventory(seedInventory);
      setMovements(seedMovements);
      setTransactions(seedTransactions);
      setAuditLogs(seedAuditLogs);
      setCategories(seedCategories);
      setExpenses(seedExpenses);
    };

    return {
      products,
      inventory,
      stockMovements: movements,
      transactions,
      categories,
      staff: seedStaff,
      expenses,
      auditLogs,
      addProduct: (p) => {
        const id = nextId('p');
        setProducts((prev) => [...prev, { ...p, id }]);
        logAudit('product.created', p.name, undefined, id);
      },
      updateProduct: (p) => {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
        logAudit('product.updated', p.name, undefined, p.id);
      },
      deleteProduct: (id) => {
        const target = products.find((p) => p.id === id)?.name ?? id;
        setProducts((prev) => prev.filter((x) => x.id !== id));
        logAudit('product.deleted', target, undefined, `deleted · ${id}`);
      },
      addInventoryItem: (item) => {
        const id = nextId('inv');
        setInventory((prev) => [...prev, { ...item, id }]);
        logAudit('inventory.created', item.name, undefined, id);
      },
      updateInventoryItem: (item) => {
        setInventory((prev) => prev.map((x) => (x.id === item.id ? item : x)));
        logAudit('inventory.updated', item.name, undefined, item.id);
      },
      deleteInventoryItem: (id) => {
        const target = inventory.find((i) => i.id === id)?.name ?? id;
        setInventory((prev) => prev.filter((x) => x.id !== id));
        logAudit('inventory.deleted', target, undefined, `deleted · ${id}`);
      },
      addCategory: (name, icon) => {
        const id = nextId('cat');
        setCategories((prev) => [...prev, { id, name, icon: icon || '🏷️' }]);
        logAudit('product.updated', name, undefined, `category created · ${id}`);
      },
      updateCategory: (category) => {
        setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
        logAudit('product.updated', category.name, undefined, `category updated · ${category.id}`);
      },
      deleteCategory: (id) => {
        const inUse = products.some((p) => p.category === categories.find((c) => c.id === id)?.name);
        if (inUse) return false;
        setCategories((prev) => prev.filter((c) => c.id !== id));
        logAudit('product.updated', id, undefined, 'category deleted');
        return true;
      },
      addExpense: (expense) => {
        const id = nextId('exp');
        setExpenses((prev) => [...prev, { ...expense, id }]);
        logAudit('expense.created', expense.name, undefined, id);
      },
      updateExpense: (expense) => {
        setExpenses((prev) => prev.map((x) => (x.id === expense.id ? expense : x)));
        logAudit('expense.updated', expense.name, undefined, expense.id);
      },
      deleteExpense: (id) => {
        const target = expenses.find((e) => e.id === id)?.name ?? id;
        setExpenses((prev) => prev.filter((x) => x.id !== id));
        logAudit('expense.deleted', target, undefined, `deleted · ${id}`);
      },
      recordMovement: ({ type, itemId, qty, note, timestamp }) => {
        const entry: StockMovementEntry = {
          id: nextId('mv'),
          itemId,
          type,
          qty,
          note,
          timestamp: timestamp ?? new Date().toISOString(),
        };
        setMovements((prev) => [...prev, entry]);
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            const n = typeof qty === 'number' ? Math.abs(qty) : Math.abs(parseFloat(String(qty)));
            const amt = Number.isFinite(n) ? n : 0;
            const delta = type === 'purchase' ? amt : type === 'adjustment' ? amt : -amt;
            return { ...item, currentStock: Math.max(0, item.currentStock + delta) };
          }),
        );
        logAudit('inventory.adjustment', entry.note ?? itemId, undefined, `${type} · ${qty}`);
      },
      recordTransaction,
      logAudit,
      resetData,
    };
  }, [products, inventory, movements, transactions, auditLogs, categories, expenses, actorId]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}