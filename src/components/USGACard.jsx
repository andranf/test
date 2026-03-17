import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";

const STATUS = {
  "on-target":    { bg: "rgba(16,185,129,0.1)",  text: "#6ee7b7", border: "rgba(16,185,129,0.22)",  bar: "#34d399", label: "On Target"    },
  "in-range":     { bg: "rgba(56,189,248,0.1)",  text: "#7dd3fc", border: "rgba(56,189,248,0.22)",  bar: "#38bdf8", label: "In Range"     },
  "out-of-range": { bg: "rgba(239,68,68,0.1)",   text: "#fca5a5", border: "rgba(239,68,68,0.22)",   bar: "#f87171", label: "Out of Range" },
};

function MetricRow({ metric }) {
  const cfg = STATUS[metric.status] || STATUS["in-range"];
  const range = metric.max - metric.min;
  const pct = Math.min(100, Math.max(0, ((metric.value - metric.min) / range) * 100));
  const targetPct = ((metric.target - metric.min) / range) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium w-44" style={{ color: "rgba(255,255,255,0.8)" }}>{metric.name}</span>
        <span className="font-bold stat-num text-white">
          {metric.value} <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>{metric.unit}</span>
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
      </div>
      {/* Range bar */}
      <div className="relative h-1.5 rounded-full overflow-visible"
        style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="absolute h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: cfg.bar, boxShadow: `0 0 8px ${cfg.bar}60` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-[-3px] w-0.5 h-[18px] rounded-full"
          style={{ left: `${targetPct}%`, background: "rgba(255,255,255,0.3)" }}
          title={`Target: ${metric.target}`}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
        <span>{metric.min}</span>
        <span>Target {metric.target}</span>
        <span>{metric.max}</span>
      </div>
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,15,28,0.92)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px", padding: "8px 12px", fontSize: "11px", backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2px" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-4 w-28" />
      </div>
      {[0, 1, 2, 3, 4].map(i => <div key={i} className="shimmer-block h-12" />)}
    </div>
  );
}

export default function USGACard({ data, loading }) {
  if (loading || !data) return <LoadingSkeleton />;

  const outOfRange = data.metrics?.filter(m => m.status === "out-of-range").length || 0;

  return (
    <div className="glass-card p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)" }}>USGA Deacon</p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{data.course}</p>
        </div>
        <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="flex items-center gap-1 justify-end">
            <ClipboardCheck size={11} style={{ color: "#60a5fa" }} />
            <span>{data.lastMeasured}</span>
          </div>
          <div className="mt-0.5">{data.measuredBy}</div>
        </div>
      </div>

      {outOfRange > 0 && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          <AlertCircle size={14} />
          {outOfRange} metric{outOfRange > 1 ? "s are" : " is"} out of range
        </div>
      )}

      {/* Metrics */}
      <div className="flex flex-col gap-4">
        {data.metrics?.map(m => <MetricRow key={m.name} metric={m} />)}
      </div>

      {/* 14-day stimp trend */}
      {data.history?.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-3"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            <TrendingUp size={12} style={{ color: "#60a5fa" }} />
            Green Speed — 14-day trend
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={data.history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="stimpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                tickLine={false} axisLine={false} interval={3}
              />
              <YAxis domain={[2.7, 3.7]}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<DarkTooltip />} />
              <ReferenceLine y={3.2} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <Area
                dataKey="stimp" name="Stimp"
                stroke="#60a5fa" strokeWidth={2}
                fill="url(#stimpGrad)"
                dot={false} activeDot={{ r: 3, fill: "#60a5fa" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
