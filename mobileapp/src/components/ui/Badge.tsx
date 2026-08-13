import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

const VARIANTS: Record<string, { bg: string; fg: string; border: string }> = {
  good: { bg: colors.goodSoft, fg: colors.good, border: '#C5DFC8' },
  low: { bg: colors.lowSoft, fg: colors.low, border: '#E8D3A6' },
  critical: { bg: colors.criticalSoft, fg: colors.critical, border: '#E3C0BA' },
  brand: { bg: colors.brandSoft, fg: colors.brandDark, border: '#D7BB9F' },
  blue: { bg: colors.blueSoft, fg: colors.blue, border: '#bfdbfe' },
  slate: { bg: '#F4EDE3', fg: colors.sub, border: colors.line },
};

export default function Badge({ children, variant = 'slate' }: { children: React.ReactNode; variant?: string }) {
  const v = VARIANTS[variant] ?? VARIANTS.slate;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});
