import { Droplets, AlertTriangle, Clock } from "lucide-react";

const COLOR = {
  green:  { bar: "bar-green",  dot: "rgba(52,211,153,1)",  bg: "rgba(16,185,129,0.1)",  text: "#6ee7b7", border: "rgba(16,185,129,0.2)"  },
  yellow: { bar: "bar-yellow", dot: "rgba(251,191,36,1)",  bg: "rgba(217,119,6,0.1)",   text: "#fcd34d", border: "rgba(217,119,6,0.2)"   },
  orange: { bar: "bar-orange", dot: "rgba(251,146,60,1)",  bg: "rgba(194,65,12,0.1)",   text: "#fdba74", border: "rgba(194,65,12,0.2)"   },
  red:    { bar: "bar-red",    dot: "rgba(248,113,113,1)", bg: "rgba(153,27,27,0.1)",   text: "#fca5a5", border: "rgba(153,27,27,0.2)"   },
  gray:   { bar: "bar-gray",   dot: "rgba(148,163,184,1)", bg: "rgba(51,65,85,0.3)",    text: "#94a3b8", border: "rgba(51,65,85,0.4)"    },
};

function StatusBadge({ status, color }) {
  const c = COLOR[color] || COLOR.gray;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {status}
    </span>
  );
}

function ZoneRow({ zone }) {
  const c = COLOR[zone.color] || COLOR.gray;
  const pct = Math.min(100, (zone.moisture / 60) * 100);
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Color accent + name */}
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />
        <span className="font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{zone.name}</span>
      </div>
      {/* Moisture bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Value */}
      <span className="text-xs w-16 text-right flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
        {zone.moisture}% VWC
      </span>
      {/* Badge */}
      <StatusBadge status={zone.status} color={zone.color} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-6 w-20 rounded-full" />
      </div>
      {[0, 1, 2, 3, 4].map(i => <div key={i} className="shimmer-block h-10" />)}
    </div>
  );
}

export default function GreenkeeperCard({ data, loading }) {
  if (loading || !data) return <LoadingSkeleton />;

  const criticalCount = data.alerts?.length || 0;
  const healthPct = data.zones
    ? Math.round((data.zones.filter(z => z.color === "green" || z.color === "yellow").length / data.zones.length) * 100)
    : 100;

  return (
    <div className="glass-card p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)" }}>Greenkeeper</p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Turf Health Overview</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {criticalCount > 0 ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={11} />
              {criticalCount} Alert{criticalCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }}>
              All Good
            </span>
          )}
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{healthPct}% healthy</span>
        </div>
      </div>

      {/* Zone list */}
      <div className="flex flex-col">
        {data.zones?.map(zone => <ZoneRow key={zone.name} zone={zone} />)}
      </div>

      {/* Irrigation summary */}
      {data.irrigation && (
        <div className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            <Clock size={12} style={{ color: "#60a5fa" }} />
            <span>Next run: <span style={{ color: "rgba(255,255,255,0.75)" }}>{data.irrigation.nextRun}</span></span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            <Droplets size={12} style={{ color: "#34d399" }} />
            <span>Runtime: <span style={{ color: "rgba(255,255,255,0.75)" }}>{data.irrigation.estimatedRuntime}</span></span>
          </div>
          {data.irrigation.activeZones > 0 && (
            <span className="font-semibold px-2 py-0.5 rounded-full text-xs"
              style={{ background: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.2)" }}>
              {data.irrigation.activeZones} zone{data.irrigation.activeZones > 1 ? "s" : ""} running
            </span>
          )}
        </div>
      )}
    </div>
  );
}
