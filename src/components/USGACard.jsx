import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";

const statusConfig = {
  "on-target": { bg: "bg-emerald-100", text: "text-emerald-700", label: "On Target", bar: "bg-emerald-500" },
  "in-range": { bg: "bg-sky-100", text: "text-sky-700", label: "In Range", bar: "bg-sky-500" },
  "out-of-range": { bg: "bg-red-100", text: "text-red-700", label: "Out of Range", bar: "bg-red-500" },
};

function MetricRow({ metric }) {
  const cfg = statusConfig[metric.status] || statusConfig["in-range"];
  const pct = Math.min(100, Math.max(0, ((metric.value - metric.min) / (metric.max - metric.min)) * 100));
  const targetPct = ((metric.target - metric.min) / (metric.max - metric.min)) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 w-40">{metric.name}</span>
        <span className="font-semibold text-slate-800">{metric.value} <span className="text-xs text-slate-400">{metric.unit}</span></span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
      </div>
      {/* Range bar */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-visible">
        <div className={`absolute h-2 rounded-full ${cfg.bar} opacity-70`} style={{ width: `${pct}%` }} />
        {/* Target marker */}
        <div
          className="absolute top-[-2px] w-0.5 h-3 bg-slate-400 rounded-full"
          style={{ left: `${targetPct}%` }}
          title={`Target: ${metric.target}`}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{metric.min}</span>
        <span>Target {metric.target}</span>
        <span>{metric.max}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function USGACard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        {[0, 1, 2].map((i) => <div key={i} className="h-10 bg-slate-200 rounded mb-3" />)}
      </div>
    );
  }

  const outOfRange = data.metrics?.filter((m) => m.status === "out-of-range").length || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">USGA Deacon</h2>
          <p className="text-sm text-slate-500">{data.course}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div className="flex items-center gap-1 justify-end">
            <ClipboardCheck size={12} />
            <span>{data.lastMeasured}</span>
          </div>
          <div>{data.measuredBy}</div>
        </div>
      </div>

      {outOfRange > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} />
          {outOfRange} metric{outOfRange > 1 ? "s are" : " is"} out of range
        </div>
      )}

      {/* Metrics */}
      <div className="flex flex-col gap-4">
        {data.metrics?.map((m) => <MetricRow key={m.name} metric={m} />)}
      </div>

      {/* 14-day stimp trend */}
      {data.history && data.history.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> Green Speed — 14-day trend
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data.history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis domain={[9, 12]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={10.5} stroke="#94a3b8" strokeDasharray="4 4" />
              <Line dataKey="stimp" name="Stimp" dot={false} stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
