import { motion } from "framer-motion";
import { Droplets, Thermometer, Zap, AlertTriangle } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";

// VWC target range for USGA sand greens
const VWC_LOW    = 16;
const VWC_TARGET = 21;
const VWC_HIGH   = 24;
const VWC_MAX    = 28;

function vwcColor(vwc) {
  if (vwc == null)    return "#64748b";
  if (vwc < VWC_LOW)  return "#fbbf24";
  if (vwc > VWC_HIGH) return "#60a5fa";
  return "#34d399";
}

function vwcLabel(vwc) {
  if (vwc == null)    return "—";
  if (vwc < VWC_LOW)  return "Dry";
  if (vwc > VWC_HIGH) return "Wet";
  return "OK";
}

function vwcBorder(vwc) {
  if (vwc == null)    return "rgba(100,116,139,0.18)";
  if (vwc < VWC_LOW)  return "rgba(251,191,36,0.28)";
  if (vwc > VWC_HIGH) return "rgba(96,165,250,0.28)";
  return "rgba(52,211,153,0.22)";
}

function vwcBg(vwc) {
  if (vwc == null)    return "rgba(100,116,139,0.07)";
  if (vwc < VWC_LOW)  return "rgba(251,191,36,0.09)";
  if (vwc > VWC_HIGH) return "rgba(96,165,250,0.09)";
  return "rgba(52,211,153,0.08)";
}

// ── Green heatmap cell ─────────────────────────────────────────────────────────

function GreenCell({ reading, index }) {
  const color  = vwcColor(reading.vwc);
  const label  = (reading.label ?? `G${index + 1}`)
    .replace(/green|hole/gi, "").replace(/\s+/g, "").trim() || `${index + 1}`;
  const shortLabel = label.length > 4 ? label.slice(0, 4) : label;

  // Mini position bar: 0 = VWC_LOW, 100 = VWC_MAX
  const barPct = reading.vwc != null
    ? Math.min(100, Math.max(0, ((reading.vwc - VWC_LOW) / (VWC_MAX - VWC_LOW)) * 100))
    : 0;
  const targetPct = ((VWC_TARGET - VWC_LOW) / (VWC_MAX - VWC_LOW)) * 100;

  return (
    <motion.div
      className="flex flex-col items-center justify-between gap-1 rounded-xl py-2 px-1.5"
      style={{ background: vwcBg(reading.vwc), border: `1px solid ${vwcBorder(reading.vwc)}` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04 }}
    >
      {/* Green label */}
      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
        {shortLabel}
      </span>

      {/* VWC value */}
      <span className="stat-num font-bold" style={{ fontSize: "15px", color, lineHeight: 1 }}>
        {reading.vwc != null ? reading.vwc : "—"}
      </span>

      {/* Status word */}
      <span style={{ fontSize: "7.5px", fontWeight: 700, color, letterSpacing: "0.04em" }}>
        {vwcLabel(reading.vwc)}
      </span>

      {/* Micro position bar */}
      <div className="relative w-full h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        {/* Target marker */}
        <div className="absolute top-0 bottom-0 w-px"
          style={{ left: `${targetPct}%`, background: "rgba(255,255,255,0.25)" }} />
        {/* Fill */}
        {reading.vwc != null && (
          <motion.div className="absolute top-0 left-0 h-full rounded-full"
            style={{ background: color }}
            initial={{ width: "0%" }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 + index * 0.04 }} />
        )}
      </div>
    </motion.div>
  );
}

// ── Summary arc gauge ──────────────────────────────────────────────────────────

function SummaryArc({ value, max, color, icon: Icon, label, unit, decimals = 1, delay = 0 }) {
  const size = 64, sw = 5;
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, Math.max(0, (value ?? 0) / max));
  const cx   = size / 2, cy = size / 2;

  return (
    <div className="glass-inner flex flex-col items-center py-3 gap-1">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 4px ${color}99)` }}
        />
        <text x={cx} y={cy + 4} textAnchor="middle"
          fontSize="12" fontWeight="700" fill={color}
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
          {value != null ? value.toFixed(decimals) : "—"}
        </text>
      </svg>
      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{label}</span>
      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.22)" }}>{unit}</span>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          {[0,1,2].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <div key={i} className="shimmer-block h-16 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TDRCard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const { readings, summary, lastUpdated, serialNumber } = data;
  const wetWatch = readings.filter(r => r.vwc > VWC_HIGH).length;
  const dryWatch = readings.filter(r => r.vwc != null && r.vwc < VWC_LOW).length;

  // Grid columns: up to 6 per row
  const cols = Math.min(readings.length, 6);

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">TDR 350 · Soil Moisture</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {readings.length} greens · {serialNumber}
            </p>
          </div>
          <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <div className="flex items-center gap-1 justify-end">
              <Droplets size={10} style={{ color: "#38bdf8" }} />
              {lastUpdated}
            </div>
            <div className="mt-0.5">Target 18–24% VWC</div>
          </div>
        </div>

        {/* Alert banner */}
        {(wetWatch > 0 || dryWatch > 0) && (
          <motion.div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd" }}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AlertTriangle size={13} />
            {wetWatch > 0 && <span>{wetWatch} wet watch</span>}
            {wetWatch > 0 && dryWatch > 0 && <span style={{ opacity: 0.4 }}>·</span>}
            {dryWatch > 0 && <span>{dryWatch} dry watch</span>}
          </motion.div>
        )}

        {/* Summary arc gauges */}
        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <SummaryArc value={summary.avgVWC}  max={VWC_MAX} color="#38bdf8"
              icon={Droplets}    label="Avg VWC"  unit="%" delay={0.1} />
            {summary.avgEC != null && (
              <SummaryArc value={summary.avgEC} max={3}    color="#a78bfa"
                icon={Zap}       label="Avg EC"   unit="mS/cm" decimals={2} delay={0.2} />
            )}
            {summary.avgTemp != null && (
              <SummaryArc value={summary.avgTemp} max={35} color="#fb923c"
                icon={Thermometer} label="Soil Temp" unit="°C" delay={0.3} />
            )}
          </div>
        )}

        {/* Heatmap grid of greens */}
        <div>
          <p className="section-label mb-2">Green-by-Green VWC</p>
          <div className="grid gap-2" style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}>
            {readings.map((r, i) => (
              <GreenCell key={i} reading={r} index={i} />
            ))}
          </div>
        </div>

        {/* VWC scale legend */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-[4px] rounded-full" style={{
            background: "linear-gradient(90deg, #fbbf24 0%, #34d399 42%, #34d399 65%, #60a5fa 100%)"
          }} />
          <div className="flex gap-3 flex-shrink-0" style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.28)" }}>
            <span style={{ color: "#fbbf24" }}>◀ Dry</span>
            <span style={{ color: "#34d399" }}>Target</span>
            <span style={{ color: "#60a5fa" }}>Wet ▶</span>
          </div>
        </div>

      </div>
    </div>
  );
}
