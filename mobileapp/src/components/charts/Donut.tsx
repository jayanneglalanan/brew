import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { EASE_CUBIC, useReducedMotion } from '../../animations';

const DEFAULT_COLORS = ['#8B6F5A', '#9CC0A0', '#E3C285', '#D5A59E', '#C9A98F', '#5C4033', '#8FAF91'];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export default function Donut({
  data,
  size = 140,
  stroke = 26,
  centerLabel,
  colors: palette = DEFAULT_COLORS,
}: {
  data: Array<{ name: string; value: number }>;
  size?: number;
  stroke?: number;
  centerLabel?: string;
  colors?: string[];
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
    Animated.timing(anim, { toValue: 1, duration: 600, easing: EASE_CUBIC, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim, reduced]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let angle = 0;
  const segments = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const path = arcPath(cx, cy, r, angle, angle + sweep);
    angle += sweep;
    return { key: `${d.name}-${i}`, path, color: palette[i % palette.length], i };
  });

  const opacity = Math.min(1, Math.max(0, (p - 0.2) / 0.8));
  const scale = 0.96 + 0.04 * Math.min(1, p * 1.2);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }], alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Path d={arcPath(cx, cy, r, 0, 360)} stroke="rgba(61,48,42,0.12)" strokeWidth={stroke} fill="none" />
        {total > 0
          ? segments.map((seg) => {
              const segOpacity = Math.min(1, Math.max(0, (p - seg.i * 0.22) / 0.25));
              return (
                <Path key={seg.key} d={seg.path} stroke={seg.color} strokeWidth={stroke} fill="none" strokeLinecap="butt" opacity={segOpacity} />
              );
            })
          : null}
        {centerLabel ? (
          <SvgText x={cx} y={cy} fontSize={18} fontWeight="800" fill={colors.onCard} textAnchor="middle" alignmentBaseline="middle">
            {centerLabel}
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
}