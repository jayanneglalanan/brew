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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.content}
    >
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <Pressable key={t.value} onPress={() => onChange(t.value)} style={[styles.tab, isActive && styles.tabActive]}>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: gap.lg },
  content: { flexDirection: 'row', gap: gap.xs },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  label: { fontSize: 12, fontWeight: '600', color: colors.sub, textAlign: 'center' },
  labelActive: { color: '#fff' },
});