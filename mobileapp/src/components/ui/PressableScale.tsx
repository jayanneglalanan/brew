import { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../../animations';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function PressableScale({ children, style, onPressIn, onPressOut, ...rest }: Props) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = (e: unknown) => {
    if (!reduced) Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
    onPressIn?.(e as Parameters<NonNullable<PressableProps['onPressIn']>>[0]);
  };
  const pressOut = (e: unknown) => {
    if (!reduced) Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
    onPressOut?.(e as Parameters<NonNullable<PressableProps['onPressOut']>>[0]);
  };

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}