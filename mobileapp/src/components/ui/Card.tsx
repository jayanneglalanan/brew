import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gap, radius } from '../../theme';
import { DUR, EASE_QUAD, useReducedMotion } from '../../animations';

export default function Card({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: DUR.base, useNativeDriver: true, easing: EASE_QUAD }),
      Animated.timing(translateY, { toValue: 0, duration: DUR.base, useNativeDriver: true, easing: EASE_QUAD }),
    ]).start();
  }, [opacity, translateY, reduced]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }, style]}>
      {title ? (
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View style={title ? styles.body : undefined}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: gap.lg },
  head: { padding: gap.lg, paddingBottom: gap.md, borderBottomWidth: 1, borderBottomColor: 'rgba(61,48,42,0.1)' },
  title: { fontSize: 15, fontWeight: '700', color: colors.onCard },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.onCardSub },
  body: { padding: gap.lg },
});