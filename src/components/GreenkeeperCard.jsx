import { Droplets, Clock, AlertTriangle } from "lucide-react";
import GaugeRing from "./ui/GaugeRing";
import AnimatedNumber from "./ui/AnimatedNumber";

// ── Color palette ─────────────────────────────────────────────────────────────

const C = {
  green:  { bar:"bar-green",  dot:"#34d399", bg:"rgba(16,185,129,0.10)", text:"#6ee7b7", border:"rgba(16,185,129,0.22)", gauge:"#34d399" },
  yellow: { bar:"bar-yellow", dot:"#fbbf24", bg:"rgba(180,83,9,0.10)",   text:"#fcd34d", border:"rgba(217,119,6,0.22)",  gauge:"#fbbf24" },
  orange: { bar:"bar-orange", dot:"#fb923c", bg:"rgba(194,65,12,0.10)",  text:"#fdba74", border:"rgba(194,65,12,0.22)",  gauge:"#fb923c" },
  red:    { bar:"bar-red",    dot:"#f87171", bg:"rgba(153,27,27,0.10)",  text:"#fca5a5", border:"rgba(153,27,27,0.22)",  gauge:"#f87171" },
  gray:   { bar:"bar-gray",   dot:"#64748b", bg:"rgba(51,65,85,0.20)",   text:"#94a3b8", border:"rgba(51,65,85,0.35)",   gauge:"#64748b" },
};

// ── Zone row ──────────────────────────────────────────────────────────────────

function ZoneRow({ zone }) {
  const c   = C[zone.color] || C.gray;
  const pct = Math.min(100, Math.max(0, ((zone.moisture - zone.targetMin) / (zone.targetMax - zone.targetMin + 4) + 0.25) * 80));

  return (
    <div className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Dot + name + type chip */}
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color:"rgba(255,255,255,0.85)" }}>{zone.name}</p>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            zone.type === "bentgrass" ? "chip-bentgrass" :
            zone.type === "fescue"    ? "chip-bentgrass" : "chip-couch"
          }`} style={{ fontSize:"9px", padding:"1px 6px" }}>
            {zone.type === "bentgrass" ? "Bentgrass" : zone.type === "fescue" ? "Fescue ↗" : "Lg. Couch"}
          </span>
        </div>
      </div>
      {/* Moisture bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
          <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width:`${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color:"rgba(255,255,255,0.28)" }}>
          <span>{zone.targetMin}%</span>
          <span>target</span>
          <span>{zone.targetMax}%</span>
        </div>
      </div>
      {/* Value */}
      <span className="stat-num text-sm font-bold w-14 text-right flex-shrink-0" style={{ color:"rgba(255,255,255,0.7)" }}>
        <AnimatedNumber value={zone.moisture} decimals={1} />
        <span className="text-xs font-normal" style={{ color:"rgba(255,255,255,0.35)" }}>%</span>
      </span>
      {/* Status badge */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: c.bg, color: c.text, border:`1px solid ${c.border}` }}>
        {zone.status}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background:"linear-gradient(90deg, #059669, #34d399, #6ee7b7)" }} />
      <div className="p-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="shimmer-block h-24 w-24 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="shimmer-block h-4 w-32" />
            <div className="shimmer-block h-4 w-48" />
          </div>
        </div>
        {[0,1,2,3,4].map(i => <div key={i} className="shimmer-block h-12" />)}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GreenkeeperCard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const total   = data.zones?.length || 1;
  const healthy = data.zones?.filter(z => z.color === "green").length || 0;
  const fair    = data.zones?.filter(z => z.color === "yellow").length || 0;
  const health  = Math.round(((healthy + fair * 0.5) / total) * 100);
  const healthCol = health >= 75 ? "#34d399" : health >= 50 ? "#fbbf24" : "#f87171";

  const alerts = data.alerts?.length || 0;
  const bsi    = data.bentgrassStressIndex;
  const bsiCol = bsi != null ? (bsi < 30 ? "#34d399" : bsi < 60 ? "#fbbf24" : "#f87171") : "#64748b";

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Emerald accent bar */}
      <div className="h-[3px] w-full" style={{ background:"linear-gradient(90deg, #059669, #34d399, #6ee7b7)" }} />

      <div className="p-6 flex flex-col gap-5">

        {/* Header row: health gauge + intelligence */}
        <div className="flex items-start gap-5">
          <GaugeRing value={health} max={100} size={88} strokeWidth={7}
            color={healthCol} unit="%" label="Course Health" />

          <div className="flex-1 flex flex-col gap-3">
            <div>
              <p className="section-label">Greenkeeper · Turf Health</p>
              {alerts > 0 ? (
                <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold"
                  style={{ color:"#fca5a5" }}>
                  <AlertTriangle size={13} />
                  {alerts} zone{alerts > 1 ? "s" : ""} need attention
                </div>
              ) : (
                <p className="text-sm mt-1 font-semibold" style={{ color:"#6ee7b7" }}>All zones nominal</p>
              )}
            </div>

            {/* Bentgrass stress + couch dormancy */}
            <div className="flex flex-wrap gap-2">
              {bsi != null && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background:`${bsiCol}18`, color:bsiCol, border:`1px solid ${bsiCol}44` }}>
                  Bentgrass stress {bsi}/100
                </span>
              )}
              {data.couchDormancy && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  data.couchDormancy.color === "green"  ? "risk-low" :
                  data.couchDormancy.color === "yellow" ? "risk-mod" : "risk-high"
                }`}>
                  Couch: {data.couchDormancy.label}
                </span>
              )}
              {data.dollarSpotRisk && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  data.dollarSpotRisk === "High" ? "risk-high" : data.dollarSpotRisk.startsWith("Moderate") ? "risk-mod" : "risk-low"
                }`}>
                  $ Spot: {data.dollarSpotRisk}
                </span>
              )}
              {data.brownPatchRisk && data.brownPatchRisk !== "Low" && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  data.brownPatchRisk === "High" ? "risk-high" : "risk-mod"
                }`}>
                  Brown Patch: {data.brownPatchRisk}
                </span>
              )}
              {data.springDeadSpotRisk && data.springDeadSpotRisk !== "Low" && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  data.springDeadSpotRisk === "High" ? "risk-high" : "risk-mod"
                }`}>
                  SDS Risk: {data.springDeadSpotRisk}
                </span>
              )}
              {data.courseNews && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background:"rgba(212,175,55,0.1)", color:"#e5c76b", border:"1px solid rgba(212,175,55,0.2)" }}>
                  📋 {data.courseNews}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone list */}
        <div className="flex flex-col">
          {data.zones?.map(z => <ZoneRow key={z.name} zone={z} />)}
        </div>

        {/* Irrigation footer */}
        {data.irrigation && (
          <div className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>
              <Clock size={12} style={{ color:"#60a5fa" }} />
              Next run: <span style={{ color:"rgba(255,255,255,0.75)", marginLeft:"3px" }}>{data.irrigation.nextRun}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>
              <Droplets size={12} style={{ color:"#34d399" }} />
              Runtime: <span style={{ color:"rgba(255,255,255,0.75)", marginLeft:"3px" }}>{data.irrigation.estimatedRuntime}</span>
            </div>
            {data.irrigation.activeZones > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background:"rgba(96,165,250,0.12)", color:"#93c5fd", border:"1px solid rgba(96,165,250,0.22)" }}>
                {data.irrigation.activeZones} zone{data.irrigation.activeZones > 1 ? "s" : ""} running
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
