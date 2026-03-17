import { Droplets, AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const colorMap = {
  green: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400", bar: "bg-yellow-400" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500" },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", bar: "bg-red-500" },
  gray: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", bar: "bg-slate-400" },
};

function StatusBadge({ status, color }) {
  const c = colorMap[color] || colorMap.gray;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function MoistureBar({ value, color }) {
  const c = colorMap[color] || colorMap.gray;
  const pct = Math.min(100, (value / 60) * 100);
  return (
    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function GreenkeeperCard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 bg-slate-200 rounded mb-2" />)}
      </div>
    );
  }

  const criticalCount = data.alerts?.length || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Greenkeeper</h2>
          <p className="text-sm text-slate-500">Turf Health Overview</p>
        </div>
        {criticalCount > 0 ? (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <AlertTriangle size={12} />
            {criticalCount} Alert{criticalCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
            All Good
          </span>
        )}
      </div>

      {/* Zone list */}
      <div className="flex flex-col gap-2">
        {data.zones?.map((zone) => (
          <div key={zone.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 w-28">
              <span className={`w-2 h-2 rounded-full ${colorMap[zone.color]?.dot || "bg-slate-400"}`} />
              <span className="font-medium text-slate-700">{zone.name}</span>
            </div>
            <MoistureBar value={zone.moisture} color={zone.color} />
            <span className="text-xs text-slate-400 w-16 text-right">{zone.moisture}% VWC</span>
            <StatusBadge status={zone.status} color={zone.color} />
          </div>
        ))}
      </div>

      {/* Irrigation summary */}
      {data.irrigation && (
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock size={13} />
            <span>Next run: <span className="font-medium text-slate-700">{data.irrigation.nextRun}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets size={13} />
            <span>Est. runtime: <span className="font-medium text-slate-700">{data.irrigation.estimatedRuntime}</span></span>
          </div>
          {data.irrigation.activeZones > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {data.irrigation.activeZones} zone{data.irrigation.activeZones > 1 ? "s" : ""} running
            </span>
          )}
        </div>
      )}
    </div>
  );
}
