import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Pagination from './Pagination';
import { colors, gap } from '../../theme';

export interface Column<T> {
  header: string;
  key: string;
  width?: number;
  lines?: number;
  render?: (row: T) => React.ReactNode;
}

const BASE_WIDTH = 64;

function CellContent({ children, lines }: { children: React.ReactNode; lines: number }) {
  if (children == null) return <Text numberOfLines={lines} style={styles.cellText} />;
  if (typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean') {
    return (
      <Text numberOfLines={lines} style={styles.cellText}>
        {children}
      </Text>
    );
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
  const { width: winWidth } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  const totalFlex = columns.reduce((sum, c) => sum + (c.width ?? 1), 0);
  const contentWidth = Math.max(winWidth, totalFlex * BASE_WIDTH);

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: contentWidth }}>
          <View style={styles.headRow}>
            {columns.map((c) => (
              <Text key={c.key} numberOfLines={1} style={[styles.headCell, { flex: c.width ?? 1 }]}>
                {c.header}
              </Text>
            ))}
          </View>
          {visible.map((row, i) => {
            const key = rowKey(row);
            return (
              <View key={key} style={[styles.row, i === visible.length - 1 && styles.last]}>
                {columns.map((c) => (
                  <View key={c.key} style={[styles.cell, { flex: c.width ?? 1 }]}>
                    {c.render ? (
                      <CellContent lines={c.lines ?? 1}>{c.render(row)}</CellContent>
                    ) : (
                      <CellContent lines={c.lines ?? 1}>{String((row as Record<string, unknown>)[c.key] ?? '')}</CellContent>
                    )}
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
  headCell: { paddingHorizontal: 8, paddingVertical: 10, fontSize: 9, lineHeight: 12, fontWeight: '700', color: colors.onCardSub, textTransform: 'uppercase', flexShrink: 1, textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(61,48,42,0.1)' },
  last: { borderBottomWidth: 0 },
  cell: { paddingHorizontal: 6, paddingVertical: 10, flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 11, lineHeight: 15, color: colors.onCard, flexShrink: 1, textAlign: 'center' },
});
