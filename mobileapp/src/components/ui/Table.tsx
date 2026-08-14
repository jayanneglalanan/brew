import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Pagination from './Pagination';
import { colors, gap } from '../../theme';

export interface Column<T> {
  header: string;
  key: string;
  align?: 'left' | 'right';
  render?: (row: T) => React.ReactNode;
}

function CellContent({ children }: { children: React.ReactNode }) {
  if (children == null) return <Text style={styles.cellText} />;
  if (typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean') {
    return <Text style={styles.cellText}>{children}</Text>;
  }
  return <>{children}</>;
}

export default function Table<T>({
  columns,
  rows,
  rowKey,
  title,
  pageSize = 10,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  title?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [widths, setWidths] = useState<number[]>([]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const recordWidth = (index: number, measured: number) => {
    setWidths((prev) => {
      if (measured <= (prev[index] ?? 0)) return prev;
      const next = prev.slice();
      next[index] = measured;
      return next;
    });
  };

  const colStyle = (index: number) => (widths[index] != null ? { width: widths[index] } : null);

  const start = (page - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.headRow}>
            {columns.map((c, i) => (
              <Text
                key={c.key}
                onLayout={(e: LayoutChangeEvent) => recordWidth(i, e.nativeEvent.layout.width)}
                style={[styles.headCell, colStyle(i), c.align === 'right' && styles.right]}
              >
                {c.header}
              </Text>
            ))}
          </View>
          {visible.map((row, i) => {
            const key = rowKey(row);
            return (
              <View key={key} style={[styles.row, i === visible.length - 1 && styles.last]}>
                {columns.map((c, j) => (
                  <View
                    key={c.key}
                    onLayout={(e: LayoutChangeEvent) => recordWidth(j, e.nativeEvent.layout.width)}
                    style={[styles.cell, colStyle(j), c.align === 'right' && styles.right]}
                  >
                    {c.render ? <CellContent>{c.render(row)}</CellContent> : <Text style={styles.cellText}>{String((row as Record<string, unknown>)[c.key] ?? '')}</Text>}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Pagination page={page} totalPages={totalPages} totalItems={rows.length} pageSize={pageSize} onChange={setPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
title: { fontSize: 12, fontWeight: '700', color: colors.onCardSub, marginBottom: gap.sm, textTransform: 'uppercase' },
  headRow: { flexDirection: 'row', backgroundColor: 'rgba(61,48,42,0.05)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(61,48,42,0.1)' },
  headCell: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 11, lineHeight: 14, fontWeight: '700', color: colors.onCardSub, textTransform: 'uppercase', minWidth: 90 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(61,48,42,0.1)' },
  last: { borderBottomWidth: 0 },
  cell: { paddingHorizontal: 12, paddingVertical: 10 },
  cellText: { fontSize: 13, lineHeight: 19, color: colors.onCard },
  right: { alignItems: 'flex-end', textAlign: 'right' },
});
