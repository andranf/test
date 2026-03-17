import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Loader2, CheckCircle2, Calendar, ClipboardList } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";

// ── Status config ──────────────────────────────────────────────────────────────

const ST = {
  Overdue:      { color: "#f87171", bg: "rgba(239,68,68,0.10)",    border: "rgba(239,68,68,0.22)",    bar: "#f87171", icon: <AlertTriangle size={11} /> },
  "In Progress":{ color: "#93c5fd", bg: "rgba(59,130,246,0.10)",   border: "rgba(59,130,246,0.22)",   bar: "#60a5fa", icon: <Loader2       size={11} /> },
  Completed:    { color: "#6ee7b7", bg: "rgba(16,185,129,0.10)",   border: "rgba(16,185,129,0.22)",   bar: "#34d399", icon: <CheckCircle2  size={11} /> },
  Scheduled:    { color: "#94a3b8", bg: "rgba(51,65,85,0.22)",     border: "rgba(51,65,85,0.38)",     bar: "#64748b", icon: <Calendar      size={11} /> },
};

const PR = {
  Urgent: { bg: "rgba(239,68,68,0.12)",   color: "#fca5a5", border: "rgba(239,68,68,0.25)"  },
  High:   { bg: "rgba(249,115,22,0.12)",  color: "#fdba74", border: "rgba(249,115,22,0.25)" },
  Normal: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.08)" },
  Low:    { bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.06)" },
};

// ── Tooltip ────────────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload.status;
  return (
    <div className="chart-tooltip">
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{s}</p>
      <p style={{ color: (ST[s] || ST.Scheduled).color, fontWeight: 600 }}>
        {payload[0].value} job{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

// ── Donut completion ring ──────────────────────────────────────────────────────

function CompletionRing({ pct, size = 80 }) {
  const sw   = 7;
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2, cy = size / 2;
  const color = pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 5px ${color}99)` }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle"
          fontSize={size * 0.20} fontWeight="700" fill={color}
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
          {pct}%
        </text>
      </svg>
      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.32)" }}>Complete</span>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #d97706, #f59e0b, #fcd34d)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="flex gap-4">
          <div className="shimmer-block h-20 w-20 rounded-full" />
          <div className="grid flex-1 grid-cols-3 gap-2">
            {[0,1,2].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
          </div>
        </div>
        {[0,1,2,3].map(i => <div key={i} className="shimmer-block h-10" />)}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function JobsCard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const chartData   = Object.entries(data.byStatus || {}).map(([status, count]) => ({ status, count }));
  const overdue     = data.byStatus?.Overdue || 0;
  const total       = Object.values(data.byStatus || {}).reduce((a, b) => a + b, 0);
  const completed   = data.byStatus?.Completed || 0;
  const completePct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeJobs  = data.jobs?.filter(j => j.status !== "Completed").slice(0, 6) || [];

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #d97706, #f59e0b, #fcd34d)" }} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">Task Tracker · Daily Jobs</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {total} total tasks
            </p>
          </div>
          {overdue > 0 ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 risk-high">
              <AlertTriangle size={11} /> {overdue} Overdue
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full risk-low">On Schedule</span>
          )}
        </div>

        {/* Completion ring + status tiles */}
        <div className="flex items-center gap-4">
          <CompletionRing pct={completePct} size={78} />

          <div className="flex-1 grid grid-cols-2 gap-2">
            {chartData.map(({ status, count }) => {
              const cfg = ST[status] || ST.Scheduled;
              return (
                <motion.div key={status} className="glass-inner flex items-center gap-2.5 px-3 py-2.5"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}>
                  <span style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</span>
                  <div>
                    <p className="stat-num font-bold text-lg leading-none" style={{ color: cfg.color }}>
                      <AnimatedNumber value={count} />
                    </p>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{status}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bar chart — taller */}
        <div className="rounded-xl px-2 pt-2"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <ResponsiveContainer width="100%" height={68}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="status"
                tick={{ fontSize: 8.5, fill: "rgba(255,255,255,0.28)" }}
                tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {chartData.map(e => (
                  <Cell key={e.status} fill={(ST[e.status] || ST.Scheduled).bar}
                    style={{ filter: `drop-shadow(0 0 4px ${(ST[e.status] || ST.Scheduled).bar}88)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task list */}
        <div className="flex flex-col">
          {activeJobs.map((job, i) => {
            const sc = ST[job.status] || ST.Scheduled;
            const pc = PR[job.priority] || PR.Normal;
            return (
              <div key={job.id} className="flex items-center justify-between gap-2 py-2.5"
                style={{ borderBottom: i < activeJobs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>
                    {job.title}
                  </p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                    {job.assignee} · {job.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                    {job.priority}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {job.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-right" style={{ fontSize: "9px", color: "rgba(255,255,255,0.17)" }}>
          ↻ {data.lastUpdated}
        </p>
      </div>
    </div>
  );
}
