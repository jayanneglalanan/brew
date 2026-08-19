import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { colors, gap, radius } from '../../theme';
import { EASE_SPRING, useReducedMotion } from '../../animations';
import PressableScale from './PressableScale';

interface FabOption {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

export default function Fab({ options }: { options: FabOption[] }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    if (reduced) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true, easing: EASE_SPRING }).start();
  }, [open, anim, reduced]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} />}
      <View pointerEvents="box-none" style={[styles.column, { bottom: Math.max(insets.bottom, 0) + 20 }]}>
        {open && (
          <View style={styles.menu} pointerEvents="box-none">
            {options.map((o, i) => (
              <Animated.View
                key={o.label}
                style={{
                  opacity: anim,
                  transform: [
                    { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [i === 0 ? 10 : 4, 0] }) },
                    { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                  ],
                }}
              >
                <Pressable
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => {
                    close();
                    o.onPress();
                  }}
                >
                  <o.icon size={17} color={colors.brand} strokeWidth={2} />
                  <Text style={styles.optionLabel}>{o.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
        <PressableScale onPress={() => setOpen((v) => !v)} style={styles.fab}>
          <Plus size={26} color="#fff" strokeWidth={2.4} />
        </PressableScale>
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