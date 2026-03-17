import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";
import GaugeRing from "./ui/GaugeRing";
import AnimatedNumber from "./ui/AnimatedNumber";

// ── Status config ──────────────────────────────────────────────────────────────

const S = {
  "on-target":    { bg: "rgba(16,185,129,0.10)",  text: "#6ee7b7", border: "rgba(16,185,129,0.22)",  label: "On Target"    },
  "in-range":     { bg: "rgba(56,189,248,0.10)",  text: "#7dd3fc", border: "rgba(56,189,248,0.22)",  label: "In Range"     },
  "out-of-range": { bg: "rgba(239,68,68,0.10)",   text: "#fca5a5", border: "rgba(239,68,68,0.22)",   label: "Out of Range" },
};

const METRIC_COLORS = {
  "Green Speed": "#60a5fa",
  "Firmness":    "#fbbf24",
  "Turf Quality":"#34d399",
  "Organic":     "#a78bfa",
  "Moisture":    "#38bdf8",
};
function getMetricColor(name) {
  return Object.entries(METRIC_COLORS).find(([k]) => name.includes(k))?.[1] ?? "#60a5fa";
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #6366f1, #60a5fa, #38bdf8)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="shimmer-block h-24 rounded-xl" />)}
        </div>
        <div className="shimmer-block h-24 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function USGACard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const outOfRange = data.metrics?.filter(m => m.status === "out-of-range").length || 0;
  const stimpM  = data.metrics?.find(m => m.name.toLowerCase().includes("speed") || m.name.toLowerCase().includes("stimp"));
  const otherMs = data.metrics?.filter(m => m !== stimpM) ?? [];

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #6366f1, #60a5fa, #38bdf8)" }} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">USGA Deacon · {data.course}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Turf Measurement Readings</p>
          </div>
          <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
            <div className="flex items-center gap-1 justify-end">
              <ClipboardCheck size={10} style={{ color: "#60a5fa" }} />
              {data.lastMeasured}
            </div>
            <div className="mt-0.5">{data.measuredBy}</div>
          </div>
        </div>

        {/* Alert */}
        {outOfRange > 0 && (
          <motion.div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AlertCircle size={13} />
            {outOfRange} metric{outOfRange > 1 ? "s are" : " is"} out of range
          </motion.div>
        )}

        {/* Stimpmeter hero */}
        {stimpM && (
          <div className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.14)" }}>
            <div className="flex flex-col flex-1">
              <p className="section-label mb-1">Green Speed (Stimpmeter)</p>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber value={stimpM.value} decimals={1}
                  className="stat-num font-black"
                  style={{
                    fontSize: "3.4rem", lineHeight: 1,
                    background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}
                />
                <span className="text-xl font-bold" style={{ color: "rgba(96,165,250,0.55)" }}>{stimpM.unit}</span>
              </div>
              {/* Range bar */}
              <div className="mt-2">
                <div className="relative h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  {/* Range fill */}
                  <div className="absolute h-full rounded-full"
                    style={{
                      left:  `${((stimpM.min) / stimpM.max) * 100}%`,
                      width: `${((stimpM.max - stimpM.min) / stimpM.max) * 100}%`,
                      background: "rgba(96,165,250,0.2)",
                    }} />
                  {/* Target marker */}
                  <div className="absolute top-[-2px] w-[2px] h-[8px] rounded-full"
                    style={{
                      left: `${(stimpM.target / stimpM.max) * 100}%`,
                      background: "#60a5fa", boxShadow: "0 0 4px #60a5fa",
                    }} />
                  {/* Value needle */}
                  <motion.div className="absolute top-[-3px] w-[3px] h-[10px] rounded-full"
                    style={{ background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }}
                    initial={{ left: "0%" }}
                    animate={{ left: `calc(${(stimpM.value / stimpM.max) * 100}% - 1.5px)` }}
                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-1" style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>
                  <span>{stimpM.min}{stimpM.unit}</span>
                  <span style={{ color: "#7dd3fc", fontWeight: 600 }}>
                    {S[stimpM.status]?.label}
                  </span>
                  <span>{stimpM.max}{stimpM.unit}</span>
                </div>
              </div>
            </div>
            <GaugeRing value={stimpM.value} max={stimpM.max} size={78} strokeWidth={6}
              color="#60a5fa" unit="m" decimals={1} />
          </div>
        )}

        {/* Other metrics — gauge grid */}
        <div className="grid grid-cols-2 gap-3">
          {otherMs.map((m, i) => {
            const cfg   = S[m.status] || S["in-range"];
            const color = getMetricColor(m.name);
            return (
              <motion.div key={m.name} className="glass-inner p-3 flex items-center gap-3"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.1 + i * 0.08 }}>
                <GaugeRing value={m.value} max={m.max} size={62} strokeWidth={5}
                  color={color} unit={m.unit} decimals={1} />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {m.name}
                  </p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                    style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)" }}>
                    Target {m.target} {m.unit}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 14-day trend chart — taller */}
        {data.history?.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="section-label flex items-center gap-1.5 mb-3">
              <TrendingUp size={10} style={{ color: "#60a5fa" }} />
              Green Speed — 14-day trend
            </p>
            <ResponsiveContainer width="100%" height={96}>
              <AreaChart data={data.history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="stimpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }}
                  tickLine={false} axisLine={false} interval={3} />
                <YAxis domain={[9.0, 12.0]}
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }}
                  tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={10.5} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
                <Area dataKey="stimp" name="Stimp" stroke="#60a5fa" strokeWidth={2}
                  fill="url(#stimpArea)" dot={false} activeDot={{ r: 3, fill: "#60a5fa" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
