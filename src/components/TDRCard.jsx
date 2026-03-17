import { Droplets, Thermometer, Zap, AlertTriangle } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";

// VWC target range for USGA sand greens: 18–24%; >25% = wet watch
const VWC_LOW    = 16;
const VWC_TARGET = 21;
const VWC_HIGH   = 24;
const VWC_MAX    = 28;

function vwcColor(vwc) {
  if (vwc == null)   return "#64748b";
  if (vwc < VWC_LOW) return "#fbbf24"; // dry
  if (vwc > VWC_HIGH) return "#60a5fa"; // wet
  return "#34d399";                      // on target
}

function vwcBg(vwc) {
  if (vwc == null)    return "rgba(100,116,139,0.08)";
  if (vwc < VWC_LOW)  return "rgba(251,191,36,0.08)";
  if (vwc > VWC_HIGH) return "rgba(96,165,250,0.08)";
  return "rgba(52,211,153,0.08)";
}

function vwcLabel(vwc) {
  if (vwc == null)    return "—";
  if (vwc < VWC_LOW)  return "Dry";
  if (vwc > VWC_HIGH) return "Wet";
  return "OK";
}

// Simple inline bar
function VWCBar({ vwc }) {
  const pct = Math.min(100, Math.max(0, ((vwc - VWC_LOW) / (VWC_MAX - VWC_LOW)) * 100));
  const targetPct = ((VWC_TARGET - VWC_LOW) / (VWC_MAX - VWC_LOW)) * 100;
  return (
    <div className="relative h-1.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.07)" }}>
      {/* target marker */}
      <div className="absolute top-0 bottom-0 w-px" style={{ left: `${targetPct}%`, background: "rgba(255,255,255,0.2)" }} />
      {/* fill */}
      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: vwcColor(vwc) }} />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />
      <div className="p-6 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          {[0,1,2].map(i => <div key={i} className="shimmer-block h-16 rounded-xl" />)}
        </div>
        {[0,1,2,3,4].map(i => <div key={i} className="shimmer-block h-8 rounded-lg" />)}
      </div>
    </div>
  );
}

export default function TDRCard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const { readings, summary, lastUpdated, serialNumber } = data;
  const wetWatch  = readings.filter(r => r.vwc > VWC_HIGH).length;
  const dryWatch  = readings.filter(r => r.vwc != null && r.vwc < VWC_LOW).length;

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Cyan accent */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />

      <div className="p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">TDR 350 · Soil Moisture</p>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {readings.length} greens · {serialNumber}
            </p>
          </div>
          <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <div className="flex items-center gap-1 justify-end">
              <Droplets size={11} style={{ color: "#38bdf8" }} />
              {lastUpdated}
            </div>
            <div className="mt-0.5">Target 18–24% VWC</div>
          </div>
        </div>

        {/* Alert banner */}
        {(wetWatch > 0 || dryWatch > 0) && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)", color: "#93c5fd" }}>
            <AlertTriangle size={14} />
            {wetWatch > 0 && <span>{wetWatch} wet watch{wetWatch > 1 ? " greens" : " green"}</span>}
            {wetWatch > 0 && dryWatch > 0 && <span style={{ opacity: 0.4 }}>·</span>}
            {dryWatch > 0 && <span>{dryWatch} dry watch{dryWatch > 1 ? " greens" : " green"}</span>}
          </div>
        )}

        {/* Summary tiles */}
        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-inner flex flex-col items-center py-3 gap-0.5">
              <Droplets size={13} style={{ color: "#38bdf8", marginBottom: 2 }} />
              <AnimatedNumber value={summary.avgVWC} decimals={1}
                className="stat-num text-xl font-bold" style={{ color: "#38bdf8" }} />
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>avg VWC %</span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>
                {summary.minVWC}–{summary.maxVWC}%
              </span>
            </div>
            {summary.avgEC != null && (
              <div className="glass-inner flex flex-col items-center py-3 gap-0.5">
                <Zap size={13} style={{ color: "#a78bfa", marginBottom: 2 }} />
                <AnimatedNumber value={summary.avgEC} decimals={2}
                  className="stat-num text-xl font-bold" style={{ color: "#a78bfa" }} />
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>avg EC mS/cm</span>
              </div>
            )}
            {summary.avgTemp != null && (
              <div className="glass-inner flex flex-col items-center py-3 gap-0.5">
                <Thermometer size={13} style={{ color: "#fb923c", marginBottom: 2 }} />
                <AnimatedNumber value={summary.avgTemp} decimals={1}
                  className="stat-num text-xl font-bold" style={{ color: "#fb923c" }} />
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>avg soil °C</span>
              </div>
            )}
          </div>
        )}

        {/* Per-green readings */}
        <div className="flex flex-col max-h-64 overflow-y-auto gap-1">
          {readings.map((r, i) => {
            const label = r.label ?? `Reading ${i + 1}`;
            const color = vwcColor(r.vwc);
            const bg    = vwcBg(r.vwc);
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ background: bg }}>
                <span className="text-xs font-semibold w-20 flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.65)" }}>
                  {label}
                </span>
                <div className="flex-1 min-w-0">
                  <VWCBar vwc={r.vwc} />
                </div>
                <span className="text-xs font-bold w-10 text-right flex-shrink-0 stat-num"
                  style={{ color }}>
                  {r.vwc != null ? `${r.vwc}%` : "—"}
                </span>
                <span className="text-xs font-semibold w-8 text-right flex-shrink-0"
                  style={{ color, opacity: 0.8 }}>
                  {vwcLabel(r.vwc)}
                </span>
                {r.rawDate && (
                  <span className="text-xs w-12 text-right flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.22)", fontSize: "10px" }}>
                    {r.rawDate}
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
