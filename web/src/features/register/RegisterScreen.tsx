import { useMemo, useState } from 'react';
import { formatPeso, type PaymentMethod, type TransactionItem } from 'mock-data';
import { useData } from '@/app/DataContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Page';

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'gcash', label: 'GCash', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
];

export default function RegisterScreen() {
  const { products, recordTransaction } = useData();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const available = useMemo(() => products.filter((p) => p.status === 'available'), [products]);
  const categories = useMemo(() => {
    const order = ['Coffee', 'Non-Coffee', 'Tea', 'Pastries', 'Desserts', 'Snacks', 'Add-ons'];
    const groups = new Map<string, typeof available>();
    for (const p of available) {
      const list = groups.get(p.category) ?? [];
      list.push(p);
      groups.set(p.category, list);
    }
    return order.filter((c) => groups.has(c)).map((c) => ({ name: c, items: groups.get(c)! }));
  }, [available]);

  const cartItems = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return [...cart.entries()]
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product: byId.get(id)!, qty }))
      .filter((c) => c.product);
  }, [cart, products]);

  const subtotal = cartItems.reduce((s, c) => s + c.product.price * c.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const add = (id: string) => setCart((prev) => new Map(prev).set(id, (prev.get(id) ?? 0) + 1));
  const remove = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = next.get(id) ?? 0;
      if (qty <= 1) next.delete(id);
      else next.set(id, qty - 1);
      return next;
    });
  };
  const clear = () => {
    setCart(new Map());
    setDiscount(0);
    setMessage(null);
  };

  const complete = () => {
    if (cartItems.length === 0) return;
    const items: TransactionItem[] = cartItems.map((c) => ({
      productId: c.product.id,
      qty: c.qty,
      price: c.product.price,
    }));
    const tx = recordTransaction({ items, paymentMethod: payment, discount });
    setMessage(`#${tx.orderNumber} recorded — ${formatPeso(total)} (${payment.toUpperCase()})`);
    clear();
  };

  return (
    <div>
      <PageHeader title="Register (POS)" subtitle="Ring up an order — new sales flow into every report instantly" />
      {message && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          ✅ {message}
          <button className="text-emerald-600 hover:underline" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {categories.map((group) => (
            <Card key={group.name} title={group.name} subtitle={`${group.items.length} items`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => add(p.id)}
                    className="flex flex-col items-start gap-1 rounded-xl border border-stone-200 bg-white p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="text-lg">☕</span>
                    <span className="text-sm font-medium leading-tight text-stone-800">{p.name}</span>
                    <span className="text-sm font-semibold text-brand-700">{formatPeso(p.price)}</span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <Card title={`Current Order · ${cartItems.reduce((s, c) => s + c.qty, 0)} items`}>
            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              {cartItems.length === 0 && <p className="py-8 text-center text-sm text-stone-300">Tap a product to add it.</p>}
              {cartItems.map((c) => (
                <div key={c.product.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{c.product.name}</p>
                    <p className="text-xs text-stone-500">{formatPeso(c.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost !px-2 !py-0.5 text-base" onClick={() => remove(c.product.id)}>−</button>
                    <span className="w-6 text-center text-sm font-semibold">{c.qty}</span>
                    <button className="btn btn-ghost !px-2 !py-0.5 text-base" onClick={() => add(c.product.id)}>+</button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-stone-800">{formatPeso(c.product.price * c.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-300">Subtotal</span>
                <span className="font-medium">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-stone-300">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-stone-300">₱</span>
                  <input
                    type="number"
                    min={0}
                    max={subtotal}
                    className="input w-24 text-right"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-stone-50">
                <span>Total</span>
                <span>{formatPeso(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="label mb-2">Payment</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPayment(opt.value)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      payment === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={clear}>Clear</button>
              <button className="btn btn-primary flex-[2] justify-center !py-2.5" onClick={complete} disabled={cartItems.length === 0}>
                Charge {formatPeso(total)}
              </button>
            </div>
            {cartItems.length > 0 && (
              <p className="mt-3 text-center text-xs text-stone-300">Records sale + stock usage · cashier Maria</p>
            )}
          </Card>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="good">Products</Badge>
            <Badge variant="slate">{available.length} on menu</Badge>
            <Badge variant="slate">{products.length - available.length} unavailable</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
