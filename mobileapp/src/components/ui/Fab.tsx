import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { colors, gap, radius } from '../../theme';

interface FabOption {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

export default function Fab({ options }: { options: FabOption[] }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} />}
      <View pointerEvents="box-none" style={[styles.column, { bottom: Math.max(insets.bottom, 0) + 20 }]}>
        {open && (
          <View style={styles.menu} pointerEvents="box-none">
            {options.map((o) => (
              <Pressable
                key={o.label}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  close();
                  o.onPress();
                }}
              >
                <o.icon size={17} color={colors.brand} strokeWidth={2} />
                <Text style={styles.optionLabel}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Plus size={26} color="#fff" strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    right: gap.lg,
    alignItems: 'flex-end',
    zIndex: 60,
    elevation: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  menu: {
    marginBottom: gap.sm,
    alignItems: 'flex-end',
    gap: gap.sm,
    zIndex: 60,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  optionPressed: { opacity: 0.85 },
  optionLabel: { fontSize: 13, fontWeight: '700', color: colors.onCard },
});
