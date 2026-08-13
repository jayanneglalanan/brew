import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, gap, radius } from '../../theme';

export default function SegmentedTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ value: string; label: string }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <Pressable key={t.value} onPress={() => onChange(t.value)} style={[styles.tab, isActive && styles.tabActive]}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: gap.lg },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginRight: gap.xs,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  label: { fontSize: 13, fontWeight: '600', color: colors.sub },
  labelActive: { color: '#fff' },
});
