import { RefreshCw } from "lucide-react";

function SourcePill({ label, ok, loading }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.2)" }} />
        {label}
      </span>
    );
  }
  if (ok) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.9)" }} />
        {label}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
      style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f87171", boxShadow: "0 0 6px rgba(248,113,113,0.9)" }} />
      {label}
    </span>
  );
}

export default function StatusBar({ sources, onRefresh, loading, lastRefreshed, nextRefreshIn }) {
  return (
    <div className="glass-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <SourcePill key={s.label} label={s.label} ok={s.ok} loading={loading} />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
        {lastRefreshed && (
          <span>Updated <span style={{ color: "rgba(255,255,255,0.5)" }}>{lastRefreshed}</span></span>
        )}
        {nextRefreshIn !== null && !loading && (
          <span>Next <span style={{ color: "rgba(255,255,255,0.5)" }}>{nextRefreshIn}s</span></span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}
