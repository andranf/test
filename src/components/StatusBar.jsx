import { RefreshCw, Wifi, WifiOff } from "lucide-react";

function SourcePill({ label, ok, loading }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
        {label}
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      {label}
    </span>
  );
}

export default function StatusBar({ sources, onRefresh, loading, lastRefreshed, nextRefreshIn }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <SourcePill key={s.label} label={s.label} ok={s.ok} loading={loading} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {lastRefreshed && <span>Updated {lastRefreshed}</span>}
        {nextRefreshIn !== null && !loading && (
          <span>Refreshing in {nextRefreshIn}s</span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 px-3 py-1.5 rounded-xl font-medium transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}
