import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { getDateRange, type DateRange, type RangeFilter } from 'mock-data';

interface RangeFilterValue {
  filter: RangeFilter;
  range: DateRange;
  custom?: DateRange;
  setFilter: (f: RangeFilter, custom?: DateRange) => void;
}

const RangeFilterContext = createContext<RangeFilterValue | null>(null);

export function RangeFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<RangeFilter>('today');
  const [custom, setCustom] = useState<DateRange | undefined>(undefined);
  const value = useMemo<RangeFilterValue>(() => {
    const range = getDateRange(filter, custom);
    return {
      filter,
      range,
      custom,
      setFilter: (f, c) => {
        setFilterState(f);
        if (f === 'custom') setCustom(c);
      },
    };
  }, [filter, custom]);
  return <RangeFilterContext.Provider value={value}>{children}</RangeFilterContext.Provider>;
}

export function useRangeFilter(): RangeFilterValue {
  const ctx = useContext(RangeFilterContext);
  if (!ctx) throw new Error('useRangeFilter must be used within RangeFilterProvider');
  return ctx;
}