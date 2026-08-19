import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gap, radius } from '../../theme';
import { DUR, useReducedMotion } from '../../animations';

type Tone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastContextValue {
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TONE_BG: Record<Tone, string> = {
  success: colors.brandDark,
  error: colors.critical,
  info: '#3D302A',
};

function ToastItem({ message, tone }: { message: string; tone: Tone }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: DUR.base, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: DUR.base, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, reduced]);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: TONE_BG[tone], opacity, transform: [{ translateY }] }]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View pointerEvents="box-none" style={[styles.wrap, { top: Math.max(insets.top, 0) + 8 }]}>
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} tone={t.tone} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: gap.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: gap.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginRight: 8,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});