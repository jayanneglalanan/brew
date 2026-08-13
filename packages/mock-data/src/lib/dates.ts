export type RangeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export const DAY_MS = 86400000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getDateRange(filter: RangeFilter, custom?: DateRange): DateRange {
  const now = new Date();
  const today = startOfDay(now);
  switch (filter) {
    case 'today':
      return { start: today, end: now, label: 'Today' };
    case 'yesterday': {
      const y = new Date(today.getTime() - DAY_MS);
      return { start: startOfDay(y), end: endOfDay(y), label: 'Yesterday' };
    }
    case 'week': {
      const dow = (today.getDay() + 6) % 7;
      const monday = new Date(today.getTime() - dow * DAY_MS);
      return { start: monday, end: now, label: 'This Week' };
    }
    case 'month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: first, end: now, label: 'This Month' };
    }
    case 'all':
      return { start: new Date(2026, 7, 1), end: now, label: 'All Time' };
    case 'custom':
      return custom ?? { start: today, end: now, label: 'Custom' };
  }
}

export function isInRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function previousPeriod(range: DateRange): DateRange {
  const length = range.end.getTime() - range.start.getTime();
  const start = new Date(range.start.getTime() - length - DAY_MS);
  const end = new Date(range.start.getTime() - 1);
  return { start, end, label: 'Previous Period' };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayLabel(iso: string): string {
  return DAY_LABELS[new Date(iso).getDay()];
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function lastNDays(n: number): Array<{ date: Date; label: string }> {
  const today = startOfDay(new Date());
  const out: Array<{ date: Date; label: string }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    out.push({ date: d, label: `${DAY_LABELS[d.getDay()]} ${d.getDate()}` });
  }
  return out;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}
