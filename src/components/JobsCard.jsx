import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Loader, CheckCircle, Calendar } from "lucide-react";

const STATUS_CFG = {
  Overdue:      { color: "#f87171", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.2)",    barFill: "#f87171" },
  "In Progress":{ color: "#93c5fd", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.2)",   barFill: "#60a5fa" },
  Completed:    { color: "#6ee7b7", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.2)",   barFill: "#34d399" },
  Scheduled:    { color: "#94a3b8", bg: "rgba(51,65,85,0.25)",    border: "rgba(51,65,85,0.4)",     barFill: "#64748b" },
};

const PRIORITY_CFG = {
  Urgent: { bg: "rgba(239,68,68,0.12)",   color: "#fca5a5", border: "rgba(239,68,68,0.25)"   },
  High:   { bg: "rgba(249,115,22,0.12)",  color: "#fdba74", border: "rgba(249,115,22,0.25)"  },
  Normal: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.08)" },
  Low:    { bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.06)" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Scheduled;
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Normal;
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {priority}
    </span>
  );
}

const DarkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,15,28,0.92)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px", padding: "8px 12px", fontSize: "11px", backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2px" }}>{payload[0].payload.status}</p>
      <p style={{ color: payload[0].fill, fontWeight: 600 }}>
        {payload[0].value} job{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-6 w-24 rounded-full" />
      </div>
      <div className="shimmer-block h-14" />
      {[0, 1, 2, 3].map(i => <div key={i} className="shimmer-block h-12" />)}
    </div>
  );
}

export default function JobsCard({ data, loading }) {
  if (loading || !data) return <LoadingSkeleton />;

  const chartData = Object.entries(data.byStatus || {}).map(([status, count]) => ({ status, count }));
  const overdue = data.byStatus?.Overdue || 0;
  const activeJobs = data.jobs?.filter(j => j.status !== "Completed").slice(0, 8) || [];

  return (
    <div className="glass-card p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)" }}>Task Tracker</p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Daily Jobs Overview</p>
        </div>
        {overdue > 0 ? (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={11} />
            {overdue} Overdue
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }}>
            On Schedule
          </span>
        )}
      </div>

      {/* Status summary pills */}
      <div className="grid grid-cols-4 gap-2">
        {chartData.map(({ status, count }) => {
          const cfg = STATUS_CFG[status] || STATUS_CFG.Scheduled;
          return (
            <div key={status} className="glass-inner flex flex-col items-center py-3 gap-1">
              <span className="stat-num text-xl font-bold" style={{ color: cfg.color }}>{count}</span>
              <span className="text-xs text-center leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>{status}</span>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl px-2 pt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <ResponsiveContainer width="100%" height={56}>
          <BarChart data={chartData} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="status" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map(entry => (
                <Cell key={entry.status} fill={(STATUS_CFG[entry.status] || STATUS_CFG.Scheduled).barFill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Job list */}
      <div className="flex flex-col gap-0 max-h-60 overflow-y-auto">
        {activeJobs.map((job, i) => (
          <div key={job.id}
            className="flex items-center justify-between gap-2 py-2.5 text-sm"
            style={{ borderBottom: i < activeJobs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: "rgba(255,255,255,0.82)" }}>{job.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {job.assignee} · Due {job.dueDate}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <PriorityBadge priority={job.priority} />
              <StatusBadge status={job.status} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
        Updated {data.lastUpdated}
      </p>
    </div>
  );
}
