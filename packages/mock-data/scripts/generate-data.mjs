import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

import products from '../src/data/products.json' with { type: 'json' };
import staff from '../src/data/staff.json' with { type: 'json' };

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260810);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randBetween = (min, max) => min + Math.floor(rand() * (max - min + 1));

const HOURLY_WEIGHTS = [0,0,0,0,0,0,0,22,34,30,18,14,20,26,18,14,12,9,6,4,2,0,0,0];

const today = new Date();
today.setHours(0, 0, 0, 0);

const now = new Date();

function toISO(d) {
  return d.toISOString();
}

function dateNDaysAgo(n, hour = 0, minute = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const transactions = [];
const auditLogs = [];
let orderCounter = 1000;

const PAYMENT_METHODS = [
  ['cash', 44], ['gcash', 35], ['card', 21],
];

function weightedPayment() {
  const total = PAYMENT_METHODS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [m, w] of PAYMENT_METHODS) {
    r -= w;
    if (r <= 0) return m;
  }
  return 'cash';
}

for (let day = 14; day >= 0; day--) {
  const isToday = day === 0;
  const isWeekend = [0, 6].includes(new Date(today.getTime() - day * 86400000).getDay());
  const baseCount = isWeekend ? randBetween(30, 40) : randBetween(20, 32);
  const generated = [];
  for (let h = 7; h < 22; h++) {
    const count = Math.round((baseCount / 100) * HOURLY_WEIGHTS[h]);
    for (let i = 0; i < count; i++) {
      const minute = randBetween(0, 59);
      generated.push([h, minute]);
    }
  }
  generated.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  for (const [h, minute] of generated) {
    if (isToday) {
      if (h > now.getHours()) continue;
      if (h === now.getHours() && minute > now.getMinutes()) continue;
    }
    const d = dateNDaysAgo(day, h, minute);
    orderCounter += 1;
    const seq = transactions.length;
    const nItems = randBetween(1, 4);
    const items = [];
    for (let k = 0; k < nItems; k++) {
      const p = pick(products.filter((x) => x.status !== 'hidden'));
      items.push({ productId: p.id, qty: randBetween(1, 2), price: p.price });
    }
    const discountPct = rand() < 0.16 ? (rand() < 0.5 ? 0.1 : 0.15) : 0;
    const sub = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = Math.round(sub * discountPct);
    const statusRoll = rand();
    const status = statusRoll < 0.015 ? 'voided' : statusRoll < 0.028 ? 'refunded' : 'completed';
    const cashier = pick(staff);
    transactions.push({
      id: `txn-${seq}`,
      orderNumber: `KF-${orderCounter}`,
      timestamp: toISO(d),
      cashierId: cashier.id,
      items,
      paymentMethod: weightedPayment(),
      discount,
      status,
    });
    if (status !== 'completed') {
      auditLogs.push({
        id: `aud-${seq}`,
        timestamp: toISO(d),
        actorId: cashier.id,
        action: status === 'voided' ? 'transaction.voided' : 'transaction.refunded',
        target: `KF-${orderCounter}`,
      });
    }
  }
}

transactions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const expenseDefs = [
  { name: 'Shop Rent', category: 'rent', amount: 25000, recurring: true, daysAgo: 10 },
  { name: 'Electricity Bill', category: 'utilities', amount: 6800, recurring: true, daysAgo: 8 },
  { name: 'Water Bill', category: 'utilities', amount: 1450, recurring: true, daysAgo: 8 },
  { name: 'Internet Bill', category: 'utilities', amount: 2200, recurring: true, daysAgo: 6 },
  { name: 'Cup & Lid Supplies', category: 'supplies', amount: 3400, recurring: false, daysAgo: 5 },
  { name: 'Coffee Bean Restock', category: 'supplies', amount: 12000, recurring: false, daysAgo: 4 },
  { name: 'Milk Delivery', category: 'supplies', amount: 5100, recurring: false, daysAgo: 2 },
  { name: 'Payroll (Part-time)', category: 'payroll', amount: 18000, recurring: true, daysAgo: 12 },
  { name: 'Social Media Boost', category: 'marketing', amount: 1500, recurring: false, daysAgo: 9 },
  { name: 'Espresso Machine Repair', category: 'maintenance', amount: 2800, recurring: false, daysAgo: 7 },
  { name: 'Cleaning Supplies', category: 'other', amount: 850, recurring: false, daysAgo: 3 },
];

const expenses = expenseDefs.map((e, idx) => {
  const d = dateNDaysAgo(e.daysAgo, randBetween(9, 16), randBetween(0, 59));
  return {
    id: `exp-${idx}`,
    name: e.name,
    category: e.category,
    amount: e.amount,
    timestamp: toISO(d),
    recurring: e.recurring,
  };
});

const actionPool = [
  'transaction.completed', 'inventory.adjustment', 'discount.applied', 'staff.login',
];
const targets = ['Inventory', 'Sales', 'POS', 'Products', 'Stock'];
let audCounter = 0;
for (const t of transactions.slice(-40)) {
  audCounter += 1;
  auditLogs.push({
    id: `aud-misc-${audCounter}`,
    timestamp: t.timestamp,
    actorId: t.cashierId,
    action: pick(actionPool),
    target: pick(targets),
  });
}
auditLogs.push({
  id: 'aud-inv-1',
  timestamp: toISO(dateNDaysAgo(0, 8, 20)),
  actorId: 's1',
  action: 'inventory.adjustment',
  target: 'Coffee Beans',
  detail: 'Adjusted stock after physical count',
});
auditLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const itemPool = [
  ['coffee-beans', 5, 'Restock from supplier'], ['espresso-beans', 4, 'Weekly roast delivery'],
  ['fresh-milk', 12, 'Dairy delivery'], ['fresh-cream', 6, 'Dairy delivery'],
  ['matcha-powder', 2, 'Restock from supplier'], ['sugar', 10, 'Grocery run'],
  ['cups-large', 200, 'Packaging restock'], ['cups-small', 150, 'Packaging restock'],
  ['lids', 250, 'Packaging restock'], ['ice', 20, 'Ice delivery'],
  ['croissant-dough', 40, 'Bakery delivery'], ['blueberries', 3, 'Fresh produce'],
  ['butter', 2, 'Bakery delivery'], ['mango-puree', 3, 'Restock from supplier'],
  ['tea-leaves', 1.5, 'Restock from supplier'], ['milk-tea-pearls', 2, 'Restock from supplier'],
];
const stockMovements = [];
let mvCounter = 0;
for (let day = 14; day >= 1; day--) {
  for (const [itemId, qty, note] of itemPool) {
    if (rand() < 0.55) {
      mvCounter += 1;
      stockMovements.push({
        id: `mv-purchase-${mvCounter}`,
        itemId,
        type: 'purchase',
        qty,
        timestamp: toISO(dateNDaysAgo(day, randBetween(8, 17), randBetween(0, 59))),
        note,
      });
    }
  }
}
const wastePool = [
  ['fresh-milk', 0.5, 'Expired stock'], ['fresh-cream', 1, 'Expired stock'],
  ['croissant-dough', 2, 'Overstock spoilage'], ['blueberries', 0.3, 'Damaged in storage'],
  ['cups-large', 3, 'Broken cups'], ['lids', 2, 'Damaged during transit'],
  ['espresso-beans', 0.2, 'Over-grind wastage'], ['ice', 5, 'Melted stock'],
];
for (let day = 14; day >= 1; day--) {
  for (const [itemId, qty, note] of wastePool) {
    if (rand() < 0.35) {
      mvCounter += 1;
      stockMovements.push({
        id: `mv-waste-${mvCounter}`,
        itemId,
        type: rand() < 0.7 ? 'wastage' : 'damaged',
        qty,
        timestamp: toISO(dateNDaysAgo(day, randBetween(10, 19), randBetween(0, 59))),
        note,
      });
    }
  }
}
stockMovements.push({
  id: 'mv-adj-1',
  itemId: 'coffee-beans',
  type: 'adjustment',
  qty: -0.5,
  timestamp: toISO(dateNDaysAgo(0, 8, 25)),
  note: 'Physical count adjustment',
});
stockMovements.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const compact = (arr) => JSON.stringify(arr);
writeFileSync(join(DATA_DIR, 'transactions.json'), compact(transactions));
writeFileSync(join(DATA_DIR, 'expenses.json'), compact(expenses));
writeFileSync(join(DATA_DIR, 'audit-logs.json'), compact(auditLogs));
writeFileSync(join(DATA_DIR, 'stock-movements.json'), compact(stockMovements));

console.log(`Generated ${transactions.length} transactions, ${expenses.length} expenses, ${auditLogs.length} audit logs, ${stockMovements.length} stock movements`);
