import { Fragment, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { EASE_CUBIC, useReducedMotion } from '../../animations';

export default function BarChart({
  data,
  height = 180,
  barWidth = 26,
  color = colors.brand,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  barWidth?: number;
  color?: string;
}) {
  const reduced = useReducedMotion();
  const [p, setP] = useState(reduced ? 1 : 0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      setP(1);
      return;
    }
    anim.setValue(0);
    const id = anim.addListener(({ value }) => setP(value));
    Animated.timing(anim, { toValue: 1, duration: 500, easing: EASE_CUBIC, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim, reduced]);

  const max = Math.max(...data.map((d) => d.value), 1);
  const gapPx = 10;
  const width = data.length * (barWidth + gapPx);
  const chartH = height - 24;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={Math.max(width, 280)} height={height}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH * p;
          const x = i * (barWidth + gapPx);
          const y = height - 18 - h;
          return (
            <Fragment key={`${d.label}-${i}`}>
              <Rect x={x} y={y} width={barWidth} height={h} rx={4} fill={color} />
              <SvgText x={x + barWidth / 2} y={height - 4} fontSize={10} fill={colors.onCardSub} textAnchor="middle">
                {d.label}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

export function SparklineRow({ label, value, pct, color = colors.good }: { label: string; value: string; pct: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.pct, { color }]}>{pct}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 13, color: colors.onCardSub, flex: 1 },
  value: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  pct: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});