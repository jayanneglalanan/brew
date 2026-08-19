import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

export const DUR = {
  quick: 150,
  base: 220,
  slow: 300,
};

export const EASE_QUAD = Easing.out(Easing.quad);
export const EASE_CUBIC = Easing.out(Easing.cubic);
export const EASE_SPRING = Easing.bezier(0.22, 1, 0.36, 1);

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}