import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gap, radius } from '../../theme';
import { useReducedMotion } from '../../animations';

export function SkeletonBlock({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduced) {
      pulse.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  return (
    <Animated.View
      style={[
        { height, width, backgroundColor: 'rgba(61,48,42,0.12)', borderRadius: radius.sm, opacity: pulse },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width="45%" height={12} />
      </View>
      <SkeletonBlock width="60%" height={22} style={{ marginTop: gap.sm }} />
      <SkeletonBlock width="35%" height={12} style={{ marginTop: gap.sm }} />
    </View>
  );
}

export function SkeletonChart() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width="40%" height={12} />
      </View>
      <SkeletonBlock height={160} style={{ marginTop: gap.lg }} />
    </View>
  );
}

export function SkeletonTable() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width="35%" height={12} />
      <View style={{ marginTop: gap.lg }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} height={26} style={{ marginBottom: gap.sm }} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonScreen() {
  return (
    <View>
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.half}>
            <SkeletonCard />
          </View>
        ))}
      </View>
      <SkeletonChart />
      <SkeletonTable />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: gap.lg,
    marginBottom: gap.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
});