import { StyleSheet, Text, View } from 'react-native';
import { colors, gap, radius } from '../../theme';
import { signed } from 'mock-data';

const ACCENTS: Record<string, { bg: string; fg: string }> = {
  brand: { bg: colors.brandSoft, fg: colors.brandDark },
  green: { bg: colors.goodSoft, fg: colors.good },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  amber: { bg: colors.lowSoft, fg: colors.low },
  red: { bg: colors.criticalSoft, fg: colors.critical },
  slate: { bg: '#F4EDE3', fg: colors.sub },
};

export default function StatCard({
  label,
  value,
  icon,
  delta,
  accent = 'brand',
  style,
}: {
  label: string;
  value: string;
  icon?: string;
  delta?: number;
  accent?: string;
  style?: object;
}) {
  const a = ACCENTS[accent] ?? ACCENTS.brand;
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
          {delta !== undefined ? (
            <Text style={[styles.delta, { color: delta >= 0 ? colors.good : colors.critical }]}>
              {signed(delta)}
            </Text>
          ) : null}
        </View>
        {icon ? (
          <View style={[styles.icon, { backgroundColor: a.bg }]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: gap.lg, marginBottom: gap.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onCardSub },
  value: { marginTop: 6, fontSize: 22, fontWeight: '800', color: colors.onCard },
  delta: { marginTop: 4, fontSize: 12, fontWeight: '600' },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginLeft: gap.sm },
});
