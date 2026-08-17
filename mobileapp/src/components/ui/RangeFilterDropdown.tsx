import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RangeFilter } from 'mock-data';
import { colors, gap, radius } from '../../theme';
import { useRangeFilter } from '../../data/RangeFilterContext';

const OPTIONS: Array<{ value: RangeFilter; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

export default function RangeFilterDropdown() {
  const { filter, range, setFilter } = useRangeFilter();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.trigger} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.triggerText}>{range.label}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.list}>
            {OPTIONS.map((o) => {
              const active = filter === o.value;
              return (
                <Pressable
                  key={o.value}
                  style={styles.option}
                  onPress={() => {
                    setFilter(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignSelf: 'flex-end', zIndex: 100, marginBottom: gap.md },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  triggerText: { fontSize: 11, fontWeight: '700', color: colors.onCard },
  chevron: { fontSize: 9, color: colors.sub },
  backdrop: { position: 'absolute', top: -2000, bottom: -2000, left: -2000, right: -2000, zIndex: 90 },
  list: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    minWidth: 160,
    zIndex: 100,
    elevation: 10,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8 },
  optionText: { fontSize: 12, color: colors.onCard },
  optionTextActive: { fontWeight: '700', color: colors.brandDark },
  check: { fontSize: 11, fontWeight: '700', color: colors.brand },
});