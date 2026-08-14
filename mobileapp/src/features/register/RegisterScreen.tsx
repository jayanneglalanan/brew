import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatPeso, type PaymentMethod, type TransactionItem } from 'mock-data';
import { useData } from '../../data/DataContext';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { colors, gap, radius } from '../../theme';

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'gcash', label: 'GCash', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
];

export default function RegisterScreen() {
  const { products, recordTransaction } = useData();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState('0');
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
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

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
    setDiscount('0');
    setMessage(null);
  };

  const complete = () => {
    if (cartItems.length === 0) return;
    const items: TransactionItem[] = cartItems.map((c) => ({
      productId: c.product.id,
      qty: c.qty,
      price: c.product.price,
    }));
    const tx = recordTransaction({ items, paymentMethod: payment, discount: discountValue });
    setMessage(`#${tx.orderNumber} recorded — ${formatPeso(total)} (${payment.toUpperCase()})`);
    clear();
  };

  return (
    <Screen title="Register (POS)" subtitle="New sales flow into every report instantly">
      {message && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>✅ {message}</Text>
        </View>
      )}

      <Card title={`Current Order · ${cartItems.reduce((s, c) => s + c.qty, 0)} items`}>
        {cartItems.length === 0 && <Text style={styles.empty}>Tap a product to add it.</Text>}
        {cartItems.map((c) => (
          <View key={c.product.id} style={styles.cartRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bold} numberOfLines={1}>{c.product.name}</Text>
              <Text style={styles.muted}>{formatPeso(c.product.price)} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyBtn} onPress={() => remove(c.product.id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyVal}>{c.qty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => add(c.product.id)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.bold}>{formatPeso(c.product.price * c.qty)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.bold}>{formatPeso(subtotal)}</Text>
        </View>
        <View style={[styles.totalRow, { alignItems: 'center' }]}>
          <Text style={styles.muted}>Discount</Text>
          <View style={styles.discountInputWrap}>
            <Text style={styles.muted}>₱</Text>
            <TextInput
              style={styles.discountInput}
              keyboardType="numeric"
              value={discount}
              onChangeText={(t) => setDiscount(t.replace(/[^0-9]/g, ''))}
            />
          </View>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.bold}>Total</Text>
          <Text style={styles.total}>{formatPeso(total)}</Text>
        </View>

        <Text style={styles.miniLabel}>Payment</Text>
        <View style={styles.payRow}>
          {PAYMENT_OPTIONS.map((opt) => (
            <Pressable key={opt.value} onPress={() => setPayment(opt.value)} style={[styles.payBtn, payment === opt.value && styles.payBtnActive]}>
              <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
              <Text style={[styles.payBtnText, payment === opt.value && styles.payBtnTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.clearBtn]} onPress={clear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.chargeBtn]} onPress={complete} disabled={cartItems.length === 0}>
            <Text style={styles.chargeText}>Charge {formatPeso(total)}</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.meta}>
        <Badge variant="good">{available.length} on menu</Badge>
        <Badge variant="slate">{products.length - available.length} unavailable</Badge>
      </View>

      {categories.map((group) => (
        <View key={group.name}>
          <Text style={styles.groupLabel}>{group.name}</Text>
          <View style={styles.productGrid}>
            {group.items.map((p) => (
              <Pressable key={p.id} style={styles.productCard} onPress={() => add(p.id)}>
                <Text style={{ fontSize: 20 }}>☕</Text>
                <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.productPrice}>{formatPeso(p.price)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.goodSoft, borderColor: colors.good, borderWidth: 1, borderRadius: radius.md, padding: gap.md, marginBottom: gap.lg },
  bannerText: { color: colors.good, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.sub, paddingVertical: gap.xl, fontSize: 13 },
  cartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F7F2EA', borderRadius: radius.sm, padding: gap.sm, marginBottom: gap.xs, gap: gap.sm },
  bold: { fontSize: 13, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 12, color: colors.sub },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: gap.xs },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyBtnText: { fontSize: 16, color: colors.ink, fontWeight: '700' },
  qtyVal: { width: 22, textAlign: 'center', fontWeight: '700', fontSize: 13, color: colors.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  total: { fontSize: 16, fontWeight: '800', color: colors.brand },
  discountInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 8, backgroundColor: '#fff' },
  discountInput: { width: 60, textAlign: 'right', fontSize: 13, fontWeight: '600', color: colors.ink, paddingVertical: 4 },
  miniLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: colors.sub, marginTop: gap.md, marginBottom: 6 },
  payRow: { flexDirection: 'row', gap: gap.sm },
  payBtn: { flex: 1, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 8, backgroundColor: '#fff' },
  payBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  payBtnText: { fontSize: 11, fontWeight: '600', color: colors.sub },
  payBtnTextActive: { color: colors.brand },
  actions: { flexDirection: 'row', gap: gap.sm, marginTop: gap.md },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  clearBtn: { backgroundColor: '#F4EDE3', borderWidth: 1, borderColor: colors.line },
  clearText: { color: colors.sub, fontWeight: '700' },
  chargeBtn: { backgroundColor: colors.brand },
  chargeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  meta: { flexDirection: 'row', gap: gap.sm, marginBottom: gap.lg },
  groupLabel: { fontSize: 14, fontWeight: '800', color: colors.onCard, marginBottom: gap.sm, marginTop: gap.xs },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: gap.lg },
  productCard: { width: '48%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: gap.md, marginBottom: gap.sm },
  productName: { fontSize: 13, fontWeight: '600', color: colors.onCard, marginTop: 4 },
  productPrice: { fontSize: 13, fontWeight: '800', color: colors.brand, marginTop: 2 },
});
