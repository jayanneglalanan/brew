import type { ReactNode } from 'react';

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
}

export default function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
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
        {rows.map((row, i) => (
          <tr key={rowKey(row, i)} className="hover:bg-stone-50/60">
            {columns.map((c) => (
              <td key={c.key} className={c.className}>
                {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
