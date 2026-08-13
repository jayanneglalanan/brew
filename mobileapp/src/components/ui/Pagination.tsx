import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gap, radius } from '../../theme';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>
        {from}–{to} of {totalItems} · Page {page} / {totalPages}
      </Text>
      <View style={styles.buttons}>
        <Pressable
          onPress={() => (atStart ? undefined : onChange(page - 1))}
          disabled={atStart}
          style={[styles.btn, atStart && styles.btnDisabled]}
          hitSlop={8}
        >
          <Text style={[styles.btnText, atStart && styles.btnTextDisabled]}>◀ Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => (atEnd ? undefined : onChange(page + 1))}
          disabled={atEnd}
          style={[styles.btn, atEnd && styles.btnDisabled]}
          hitSlop={8}
        >
          <Text style={[styles.btnText, atEnd && styles.btnTextDisabled]}>Next ▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: gap.md, borderTopWidth: 1, borderTopColor: '#F3ECE2', marginTop: gap.md },
  info: { fontSize: 11, fontWeight: '600', color: colors.onCardSub },
  buttons: { flexDirection: 'row', gap: gap.sm },
  btn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#F7F2EA', borderColor: '#F0E2D6' },
  btnText: { fontSize: 12, fontWeight: '700', color: colors.brand },
  btnTextDisabled: { color: '#B19C88' },
});