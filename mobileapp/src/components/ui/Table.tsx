import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Pagination from './Pagination';
import { colors, gap } from '../../theme';
import { DUR, EASE_QUAD, useReducedMotion } from '../../animations';

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

function AnimatedRow({ animate, fadeOut, children }: { animate: boolean; fadeOut: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fadeOut) {
      Animated.timing(opacity, { toValue: 0, duration: DUR.base, useNativeDriver: true, easing: EASE_QUAD }).start();
      return;
    }
    if (animate) {
      if (reduced) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }
      opacity.setValue(0);
      translateY.setValue(4);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: DUR.base, useNativeDriver: true, easing: EASE_QUAD }),
        Animated.timing(translateY, { toValue: 0, duration: DUR.base, useNativeDriver: true, easing: EASE_QUAD }),
      ]).start();
    }
  }, [animate, fadeOut, opacity, translateY, reduced]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function Table<T>({
  columns,
  rows,
  rowKey,
  title,
  pageSize = 10,
  fadingKeys,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  title?: string;
  pageSize?: number;
  fadingKeys?: ReadonlySet<string>;
}) {
  const { width: winWidth } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const seen = useRef<Set<string> | null>(null);
  const [animKeys, setAnimKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (seen.current === null) {
    seen.current = new Set(rows.map((r) => rowKey(r)));
  } else {
    const newKeys = rows.map((r) => rowKey(r)).filter((k) => !seen.current!.has(k));
    if (newKeys.length > 0) {
      newKeys.forEach((k) => seen.current!.add(k));
      setAnimKeys((prev) => new Set([...prev, ...newKeys]));
    }
  }

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
            const animate = animKeys.has(key);
            const fadeOut = fadingKeys?.has(key) ?? false;
            return (
              <AnimatedRow key={key} animate={animate} fadeOut={fadeOut}>
                <View style={[styles.row, i === visible.length - 1 && styles.last]}>
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
              </AnimatedRow>
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