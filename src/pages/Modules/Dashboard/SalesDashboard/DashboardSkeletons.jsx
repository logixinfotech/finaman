// shared skeleton primitives — put in a new file: DashboardSkeletons.jsx
export function PlaceholderCard({ title, height = 280, span = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${span}`}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">{title}</h4>
      <div className="animate-pulse rounded-lg bg-slate-100" style={{ height }} />
    </div>
  );
}

export function PlaceholderKpiStrip({ n = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export function PlaceholderInsights() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">✨ AI Insights</h4>
      <div className="h-16 animate-pulse rounded-lg bg-slate-100 mb-3" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}