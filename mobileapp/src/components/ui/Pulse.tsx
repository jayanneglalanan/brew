import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { EASE_QUAD, useReducedMotion } from '../../animations';

export default function Pulse({ children, speed = 1300 }: { children: React.ReactNode; speed?: number }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: speed / 2, useNativeDriver: true, easing: EASE_QUAD }),
        Animated.timing(v, { toValue: 0, duration: speed / 2, useNativeDriver: true, easing: EASE_QUAD }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduced, speed]);

  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}