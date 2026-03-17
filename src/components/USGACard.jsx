import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";
import GaugeRing from "./ui/GaugeRing";
import AnimatedNumber from "./ui/AnimatedNumber";

// ── Status config ─────────────────────────────────────────────────────────────

const S = {
  "on-target":    { bg:"rgba(16,185,129,0.10)",  text:"#6ee7b7", border:"rgba(16,185,129,0.22)",  bar:"#34d399", label:"On Target"    },
  "in-range":     { bg:"rgba(56,189,248,0.10)",  text:"#7dd3fc", border:"rgba(56,189,248,0.22)",  bar:"#38bdf8", label:"In Range"     },
  "out-of-range": { bg:"rgba(239,68,68,0.10)",   text:"#fca5a5", border:"rgba(239,68,68,0.22)",   bar:"#f87171", label:"Out of Range" },
};

// ── Gauge colors per metric ───────────────────────────────────────────────────

const METRIC_COLORS = {
  "Green Speed":    "#60a5fa",
  "Firmness":       "#fbbf24",
  "Turf Quality":   "#34d399",
  "Organic Matter": "#a78bfa",
  "Soil Moisture":  "#38bdf8",
};

function getMetricColor(name) {
  return Object.entries(METRIC_COLORS).find(([k]) => name.includes(k))?.[1] ?? "#60a5fa";
}

// ── Dark tooltip ──────────────────────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(8,15,25,0.94)", border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:"10px", padding:"8px 12px", fontSize:"11px", backdropFilter:"blur(12px)",
    }}>
      <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:"3px" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight:600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background:"linear-gradient(90deg, #6366f1, #60a5fa, #38bdf8)" }} />
      <div className="p-6 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-16 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="shimmer-block h-24 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function USGACard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const outOfRange = data.metrics?.filter(m => m.status === "out-of-range").length || 0;

  // Find stimpmeter metric for hero display
  const stimpM  = data.metrics?.find(m => m.name.toLowerCase().includes("speed") || m.name.toLowerCase().includes("stimp"));
  const otherMs = data.metrics?.filter(m => m !== stimpM) ?? [];

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Blue/indigo accent */}
      <div className="h-[3px] w-full" style={{ background:"linear-gradient(90deg, #6366f1, #60a5fa, #38bdf8)" }} />

      <div className="p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">USGA Deacon · {data.course}</p>
            <p className="text-sm mt-0.5" style={{ color:"rgba(255,255,255,0.45)" }}>Turf Measurement Readings</p>
          </div>
          <div className="text-right text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
            <div className="flex items-center gap-1 justify-end">
              <ClipboardCheck size={11} style={{ color:"#60a5fa" }} />
              {data.lastMeasured}
            </div>
            <div className="mt-0.5">{data.measuredBy}</div>
          </div>
        </div>

        {outOfRange > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", color:"#fca5a5" }}>
            <AlertCircle size={14} />
            {outOfRange} metric{outOfRange > 1 ? "s are" : " is"} out of range
          </div>
        )}

        {/* Stimpmeter hero */}
        {stimpM && (
          <div className="rounded-xl p-4 flex items-center gap-4"
            style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.15)" }}>
            <div className="flex flex-col">
              <p className="section-label mb-1">Green Speed (Stimpmeter)</p>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber value={stimpM.value} decimals={1}
                  className="stat-num font-black"
                  style={{
                    fontSize:"3.5rem", lineHeight:1,
                    background:"linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                  }}
                />
                <span className="text-xl font-bold" style={{ color:"rgba(96,165,250,0.6)" }}>m</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stimpM.status === "on-target" ? "risk-low" : stimpM.status === "in-range" ? "" : "risk-high"
                }`}
                  style={stimpM.status === "in-range" ? {
                    background:"rgba(56,189,248,0.1)", color:"#7dd3fc", border:"1px solid rgba(56,189,248,0.22)"
                  } : {}}>
                  {S[stimpM.status]?.label}
                </span>
                <span className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
                  Target {stimpM.target}m · Range {stimpM.min}–{stimpM.max}m
                </span>
              </div>
            </div>
            <GaugeRing
              value={stimpM.value} max={stimpM.max} size={80} strokeWidth={6}
              color="#60a5fa" unit="m" decimals={1}
            />
          </div>
        )}

        {/* Other metrics as gauge grid */}
        <div className="grid grid-cols-2 gap-3">
          {otherMs.map(m => {
            const cfg   = S[m.status] || S["in-range"];
            const color = getMetricColor(m.name);
            return (
              <div key={m.name} className="glass-inner p-3 flex items-center gap-3">
                <GaugeRing value={m.value} max={m.max} size={64} strokeWidth={5}
                  color={color} unit={m.unit} decimals={1} />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color:"rgba(255,255,255,0.7)" }}>
                    {m.name}
                  </p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                    style={{ background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                  <p className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>
                    Target {m.target} {m.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 14-day trend chart */}
        {data.history?.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p className="section-label flex items-center gap-1.5 mb-3">
              <TrendingUp size={11} style={{ color:"#60a5fa" }} />
              Green Speed — 14-day trend
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={data.history} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                <defs>
                  <linearGradient id="stimpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  tick={{ fontSize:9, fill:"rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis domain={[9.0,12.0]}
                  tick={{ fontSize:9, fill:"rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine y={10.5} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <Area dataKey="stimp" name="Stimp" stroke="#60a5fa" strokeWidth={2}
                  fill="url(#stimpArea)" dot={false} activeDot={{ r:3, fill:"#60a5fa" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
