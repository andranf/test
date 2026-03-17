import { motion } from "framer-motion";
import { Droplets, Clock, AlertTriangle } from "lucide-react";
import GaugeRing from "./ui/GaugeRing";
import AnimatedNumber from "./ui/AnimatedNumber";

// ── Color palette ──────────────────────────────────────────────────────────────

const C = {
  green:  { dot: "#34d399", bg: "rgba(52,211,153,0.10)",   border: "rgba(52,211,153,0.22)"  },
  yellow: { dot: "#fbbf24", bg: "rgba(180,83,9,0.10)",     border: "rgba(217,119,6,0.22)"   },
  orange: { dot: "#fb923c", bg: "rgba(194,65,12,0.10)",    border: "rgba(194,65,12,0.22)"   },
  red:    { dot: "#f87171", bg: "rgba(153,27,27,0.10)",    border: "rgba(153,27,27,0.22)"   },
  gray:   { dot: "#64748b", bg: "rgba(51,65,85,0.14)",     border: "rgba(51,65,85,0.28)"    },
};

// ── Zone tile — mini arc gauge per zone ────────────────────────────────────────

function ZoneTile({ zone, index }) {
  const c   = C[zone.color] || C.gray;
  const pct = Math.min(100, Math.max(0,
    ((zone.moisture - zone.targetMin) / Math.max(1, zone.targetMax - zone.targetMin + 4) + 0.25) * 80
  ));
  const size = 54, sw = 4.5;
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2, cy = size / 2;

  return (
    <motion.div
      className="flex flex-col items-center gap-1 rounded-xl py-2 px-1"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, delay: index * 0.06 }}
    >
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={c.dot} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 + index * 0.06 }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 3px ${c.dot}88)` }}
        />
        {/* Moisture value */}
        <text x={cx} y={cy + 4} textAnchor="middle"
          fontSize="9.5" fontWeight="700" fill="white"
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
          {zone.moisture}%
        </text>
      </svg>
      {/* Zone name */}
      <p style={{ fontSize: "8.5px", fontWeight: 600, color: "rgba(255,255,255,0.72)",
        textAlign: "center", lineHeight: 1.2, maxWidth: "52px",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {zone.name}
      </p>
      {/* Type chip */}
      <span className={zone.type === "couch" ? "chip-couch" : "chip-bentgrass"}
        style={{ fontSize: "7px", padding: "1px 4px", borderRadius: "4px", fontWeight: 600 }}>
        {zone.type === "bentgrass" ? "BG" : zone.type === "fescue" ? "FC" : "C4"}
      </span>
    </motion.div>
  );
}

// ── Risk indicator row ─────────────────────────────────────────────────────────

function RiskRow({ label, level }) {
  if (!level || level === "Low") return null;
  const cfg = level === "High"
    ? { color: "#fca5a5", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", bar: "#f87171" }
    : { color: "#fcd34d", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.22)", bar: "#fbbf24" };

  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.bar, boxShadow: `0 0 5px ${cfg.bar}` }} />
      <span style={{ fontSize: "10px", fontWeight: 600, color: cfg.color }}>{label}</span>
      <span className="ml-auto" style={{ fontSize: "10px", color: cfg.color, fontWeight: 700 }}>{level}</span>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #059669, #34d399, #6ee7b7)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="shimmer-block h-24 w-24 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="shimmer-block h-4 w-32" />
            <div className="shimmer-block h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[0,1,2,3,4].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

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

  // Count zones by status for the mini bar
  const onTarget = data.zones?.filter(z => z.color === "green").length  || 0;
  const watch    = data.zones?.filter(z => z.color === "yellow" || z.color === "orange").length || 0;
  const critical = data.zones?.filter(z => z.color === "red").length    || 0;

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #059669, #34d399, #6ee7b7)" }} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header row: health gauge + summary */}
        <div className="flex items-start gap-5">
          <GaugeRing value={health} max={100} size={86} strokeWidth={7}
            color={healthCol} unit="%" label="Course Health" />

          <div className="flex-1 flex flex-col gap-2.5">
            <div>
              <p className="section-label">Greenkeeper · Turf Health</p>
              {alerts > 0 ? (
                <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold"
                  style={{ color: "#fca5a5" }}>
                  <AlertTriangle size={13} />
                  {alerts} zone{alerts > 1 ? "s need" : " needs"} attention
                </div>
              ) : (
                <p className="text-sm mt-1 font-semibold" style={{ color: "#6ee7b7" }}>All zones nominal</p>
              )}
            </div>

            {/* Zone status mini bar */}
            <div className="flex gap-1 h-[6px] rounded-full overflow-hidden">
              {onTarget > 0 && (
                <motion.div className="h-full rounded-l-full"
                  style={{ flex: onTarget, background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.6)" }}
                  initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }} />
              )}
              {watch > 0 && (
                <motion.div className="h-full"
                  style={{ flex: watch, background: "#fbbf24" }}
                  initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }} />
              )}
              {critical > 0 && (
                <motion.div className="h-full rounded-r-full"
                  style={{ flex: critical, background: "#f87171", boxShadow: "0 0 6px rgba(248,113,113,0.6)" }}
                  initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }} />
              )}
            </div>
            <div className="flex gap-3" style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>
              <span><span style={{ color: "#34d399" }}>●</span> {onTarget} OK</span>
              {watch    > 0 && <span><span style={{ color: "#fbbf24" }}>●</span> {watch} Watch</span>}
              {critical > 0 && <span><span style={{ color: "#f87171" }}>●</span> {critical} Critical</span>}
            </div>

            {/* BSI pill */}
            {bsi != null && (
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-[3px] rounded-full"
                    style={{ background: bsiCol, boxShadow: `0 0 4px ${bsiCol}88` }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${bsi}%` }}
                    transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: bsiCol, flexShrink: 0 }}>
                  BSI {bsi}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Zone grid */}
        {data.zones?.length > 0 && (
          <div>
            <p className="section-label mb-2">Zone Moisture</p>
            <div className="grid gap-2" style={{
              gridTemplateColumns: `repeat(${Math.min(data.zones.length, 6)}, 1fr)`,
            }}>
              {data.zones.map((z, i) => <ZoneTile key={z.name} zone={z} index={i} />)}
            </div>
          </div>
        )}

        {/* Active risk indicators (only show non-Low risks) */}
        {(data.dollarSpotRisk || data.brownPatchRisk || data.springDeadSpotRisk) && (
          <div className="flex flex-col gap-1.5">
            <RiskRow label="Dollar Spot"     level={data.dollarSpotRisk} />
            <RiskRow label="Brown Patch"     level={data.brownPatchRisk} />
            <RiskRow label="Spring Dead Spot" level={data.springDeadSpotRisk} />
            {data.couchDormancy && data.couchDormancy.color !== "green" && (
              <RiskRow label="Couch Dormancy"
                level={data.couchDormancy.color === "yellow" ? "Moderate" : "High"} />
            )}
          </div>
        )}

        {/* Course news */}
        {data.courseNews && (
          <div className="rounded-xl px-3 py-2.5 text-xs font-medium"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)", color: "#e5c76b" }}>
            📋 {data.courseNews}
          </div>
        )}

        {/* Irrigation footer */}
        {data.irrigation && (
          <div className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Clock    size={11} style={{ color: "#60a5fa" }} />
              Next: <span style={{ color: "rgba(255,255,255,0.72)", marginLeft: 3 }}>{data.irrigation.nextRun}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Droplets size={11} style={{ color: "#34d399" }} />
              <span style={{ color: "rgba(255,255,255,0.72)" }}>{data.irrigation.estimatedRuntime}</span>
            </div>
            {data.irrigation.activeZones > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.22)" }}>
                {data.irrigation.activeZones} running
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
