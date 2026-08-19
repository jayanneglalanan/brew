import { useRef, useState, type ReactNode } from 'react';

export interface Column<T> {
  header: string;
  key: string;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  removingKeys?: ReadonlySet<string>;
}

export default function Table<T>({ columns, rows, rowKey, removingKeys }: TableProps<T>) {
  const seen = useRef<Set<string> | null>(null);
  const [animKeys, setAnimKeys] = useState<Set<string>>(() => new Set());

  if (seen.current === null) {
    seen.current = new Set(rows.map((r, i) => rowKey(r, i)));
  } else {
    const newKeys = rows.map((r, i) => rowKey(r, i)).filter((k) => !seen.current!.has(k));
    if (newKeys.length > 0) {
      newKeys.forEach((k) => seen.current!.add(k));
      setAnimKeys((prev) => new Set([...prev, ...newKeys]));
    }
  }

  return (
    <table className="tbl w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50">
          {columns.map((c) => (
            <th key={c.key} className={c.className}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {rows.map((row, i) => {
          const key = rowKey(row, i);
          const anim = animKeys.has(key) ? 'animate-row-in' : '';
          const removing = removingKeys?.has(key) ? 'animate-row-out' : '';
          return (
            <tr key={key} className={`hover:bg-stone-50/60 ${anim} ${removing}`}>
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
