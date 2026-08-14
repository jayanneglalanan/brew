import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, gap, radius } from '../../theme';

const ITEMS = [
  { key: 'products', label: 'Products & Menu', icon: '☕', desc: 'Menu items, cost & profitability', route: 'Products' as const },
  { key: 'analytics', label: 'Analytics', icon: '📈', desc: 'Top sellers, trending & peak hours', route: 'Analytics' as const },
  { key: 'profit', label: 'Profit & Expenses', icon: '💵', desc: 'Revenue, COGS, expenses & net profit', route: 'Profit' as const },
  { key: 'management', label: 'Management', icon: '⚙️', desc: 'Staff, audit logs & settings', route: 'Management' as const },
];

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.78, 320);

export default function AppDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [visible, setVisible] = useState(false);

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

  const go = (route: 'Products' | 'Analytics' | 'Profit' | 'Management') => {
    onClose();
    nav.navigate(route);
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
              <Text style={styles.brandName}>KapeFlow</Text>
              <Text style={styles.brandSub}>Admin Console</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Tools & Management</Text>

          {ITEMS.map((item) => (
            <Pressable key={item.key} style={styles.item} onPress={() => go(item.route)}>
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
  brandSub: { fontSize: 12, color: colors.onCardSub },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4EDE3' },
  closeText: { fontSize: 14, color: colors.sub, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onCardSub, marginBottom: gap.sm },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: gap.md, borderBottomWidth: 1, borderBottomColor: 'rgba(61,48,42,0.08)' },
  itemIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '700', color: colors.onCard },
  itemDesc: { fontSize: 12, color: colors.onCardSub, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.onCardSub },
});
