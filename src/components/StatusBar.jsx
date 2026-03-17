import { RefreshCw, Battery, BatteryLow, BatteryMedium, Signal } from "lucide-react";

function batteryIcon(pct) {
  if (pct == null) return null;
  if (pct < 20) return <BatteryLow  size={10} style={{ color: "#f87171" }} />;
  if (pct < 50) return <BatteryMedium size={10} style={{ color: "#fbbf24" }} />;
  return <Battery size={10} style={{ color: "#6ee7b7" }} />;
}

function signalBars(val) {
  // val may be dBm (negative) or 0–100 percentage
  if (val == null) return null;
  const pct = val < 0
    ? Math.max(0, Math.min(100, ((val + 110) / 70) * 100)) // -110 dBm = 0%, -40 dBm = 100%
    : Math.min(100, val);
  const color = pct > 60 ? "#6ee7b7" : pct > 30 ? "#fbbf24" : "#f87171";
  return <Signal size={10} style={{ color }} />;
}

function SourcePill({ label, ok, loading, battery, signal }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
        style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.08)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:"rgba(255,255,255,0.2)" }} />
        {label}
      </span>
    );
  }
  if (ok) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ background:"rgba(16,185,129,0.1)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.2)" }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background:"#34d399", boxShadow:"0 0 6px rgba(52,211,153,0.9)" }} />
        {label}
        {batteryIcon(battery)}
        {battery != null && <span style={{ fontSize:"9px", opacity:0.7 }}>{Math.round(battery)}%</span>}
        {signalBars(signal)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
      style={{ background:"rgba(239,68,68,0.1)", color:"#fca5a5", border:"1px solid rgba(239,68,68,0.2)" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background:"#f87171", boxShadow:"0 0 6px rgba(248,113,113,0.9)" }} />
      {label}
    </span>
  );
}

export default function StatusBar({ sources, onRefresh, loading, lastRefreshed, nextRefreshIn }) {
  return (
    <div className="glass-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <SourcePill key={s.label} label={s.label} ok={s.ok} loading={loading}
            battery={s.battery} signal={s.signal} />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs" style={{ color:"rgba(255,255,255,0.28)" }}>
        {lastRefreshed && (
          <span>Updated <span style={{ color:"rgba(255,255,255,0.5)" }}>{lastRefreshed}</span></span>
        )}
        {nextRefreshIn !== null && !loading && (
          <span>Next <span style={{ color:"rgba(255,255,255,0.5)" }}>{nextRefreshIn}s</span></span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-40"
          style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)" }}
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
