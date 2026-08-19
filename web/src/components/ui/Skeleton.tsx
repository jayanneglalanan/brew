export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonStat() {
  return (
    <div className="card card-pad">
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-3 h-7 w-24" />
      <SkeletonBlock className="mt-2 h-3 w-20" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      <SkeletonBlock className="mt-5 h-44 w-full" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="card p-5">
      <SkeletonBlock className="h-4 w-48" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <SkeletonChart />
      <SkeletonTable />
    </div>
  );
}
