import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
      <p className="text-xs font-medium text-stone-500">
        {from}–{to} of {totalItems} · Page {page} / {totalPages}
      </p>
      <div className="flex gap-1.5">
        <button
          className="btn btn-ghost !px-2.5 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atStart}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          className="btn btn-ghost !px-2.5 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atEnd}
          onClick={() => onChange(page + 1)}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}