import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useAuth } from '../../data/AuthContext';
import { useShopName } from '../../data/ShopNameContext';
import { colors, gap, radius } from '../../theme';
import type { SessionUser } from 'mock-data';

const ITEMS = [
  { key: 'inventory', label: 'Inventory', icon: '📦', desc: 'Stock, movements & history' },
  { key: 'products', label: 'Products & Menu', icon: '☕', desc: 'Menu items, cost & profitability', route: 'Products' as const },
  { key: 'analytics', label: 'Analytics', icon: '📈', desc: 'Top sellers, trending & peak hours', route: 'Analytics' as const },
  { key: 'profit', label: 'Profit & Expenses', icon: '💵', desc: 'Revenue, COGS, expenses & net profit', route: 'Profit' as const },
  { key: 'management', label: 'Management', icon: '⚙️', desc: 'Staff, audit logs & settings', route: 'Management' as const },
];

const ALLOWED_BY_ROLE: Record<string, string[]> = {
  owner: ['products', 'analytics', 'profit', 'management'],
  manager: ['inventory', 'products'],
  cashier: ['products'],
};

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.78, 320);

export default function AppDrawer({ open, onClose, user }: { open: boolean; onClose: () => void; user: SessionUser | null }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const { shopName } = useShopName();
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [visible, setVisible] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: PANEL_WIDTH, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [open, translateX]);

  if (!visible) return null;

  const allowed = new Set(ALLOWED_BY_ROLE[user?.role ?? 'owner'] ?? []);
  const items = ITEMS.filter((item) => allowed.has(item.key));

  const go = (item: (typeof ITEMS)[number]) => {
    onClose();
    if (item.key === 'inventory') {
      nav.popToTop();
    } else if (item.route) {
      nav.navigate(item.route);
    }
  };

  const handleLogout = () => {
    onClose();
    logout().then(() => {
      nav.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandEmoji}>☕</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName} numberOfLines={1}>{shopName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {user ? (
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: gap.md }}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Tools & Management</Text>

          {items.map((item) => (
            <Pressable key={item.key} style={styles.item} onPress={() => go(item)}>
              <View style={styles.itemIcon}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: gap.md }}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          <View style={{ flex: 1 }} />

          {user ? (
            <View style={styles.footer}>
              {logoutOpen ? (
                <View style={styles.logoutConfirm}>
                  <Text style={styles.logoutConfirmTitle}>Log out</Text>
                  <View style={styles.logoutActions}>
                    <Pressable style={[styles.logoutBtn, styles.cancelBtn]} onPress={() => setLogoutOpen(false)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[styles.logoutBtn, styles.logoutFill]} onPress={handleLogout}>
                      <Text style={styles.logoutFillText}>Log out</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.logout} onPress={() => setLogoutOpen(true)}>
                  <Text style={styles.logoutIcon}>↪</Text>
                  <Text style={styles.logoutLabel}>Log out</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,48,42,0.45)' },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.card,
    paddingTop: gap.xl,
    paddingBottom: gap.xl,
    paddingHorizontal: gap.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: gap.xl },
  brandIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  brandEmoji: { fontSize: 20 },
  brandName: { fontSize: 17, fontWeight: '800', color: colors.onCard },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4EDE3' },
  closeText: { fontSize: 14, color: colors.sub, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onCardSub, marginBottom: gap.sm },
  footer: {
    marginTop: gap.md,
    paddingTop: gap.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,48,42,0.1)',
  },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F1E8', borderRadius: radius.md, padding: gap.md, marginBottom: gap.lg },
  userAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 14, fontWeight: '800', color: colors.onCard },
  userRole: { fontSize: 12, textTransform: 'capitalize', color: colors.onCardSub, marginTop: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: gap.md, borderBottomWidth: 1, borderBottomColor: 'rgba(61,48,42,0.08)' },
  itemIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '700', color: colors.onCard },
  itemDesc: { fontSize: 12, color: colors.onCardSub, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.onCardSub },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.critical,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: gap.md,
  },
  logoutIcon: { fontSize: 16, color: '#fff' },
  logoutLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  logoutConfirm: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: gap.md,
  },
  logoutConfirmTitle: { fontSize: 15, fontWeight: '800', color: colors.onCard, marginBottom: gap.sm },
  logoutActions: { flexDirection: 'row', gap: gap.sm },
  logoutBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
  logoutFill: { backgroundColor: colors.critical },
  logoutFillText: { color: '#fff', fontWeight: '700' },
});
