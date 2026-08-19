import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gap, radius } from '../../theme';
import { DUR, EASE_CUBIC, EASE_QUAD, useReducedMotion } from '../../animations';

export default function AnimatedModal({
  visible,
  onClose,
  children,
  panelStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else if (mounted) {
      Animated.timing(backdrop, { toValue: 0, duration: DUR.quick, useNativeDriver: true, easing: EASE_QUAD }).start(() =>
        setMounted(false),
      );
      Animated.timing(scale, { toValue: 0.96, duration: DUR.quick, useNativeDriver: true, easing: EASE_QUAD }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (reduced) {
      backdrop.setValue(1);
      scale.setValue(1);
      return;
    }
    backdrop.setValue(0);
    scale.setValue(0.96);
    Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true, easing: EASE_QUAD }).start();
    Animated.timing(scale, { toValue: 1, duration: DUR.base, useNativeDriver: true, easing: EASE_CUBIC }).start();
  }, [mounted, reduced, backdrop, scale]);

  if (!mounted) return null;

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.panel, { transform: [{ scale }] }, panelStyle]}>{children}</Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: gap.lg },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: gap.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
  },
});