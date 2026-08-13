export function formatPeso(value: number, options?: { compact?: boolean; decimals?: number }): string {
  const decimals = options?.decimals ?? 2;
  if (options?.compact) {
    if (Math.abs(value) >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `₱${(value / 1000).toFixed(1)}K`;
  }
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-PH', { maximumFractionDigits: 1 });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function signed(value: number, suffix = '%'): string {
  const sign = value >= 0 ? '↑' : '↓';
  return `${sign} ${Math.abs(value).toFixed(1)}${suffix}`;
}
