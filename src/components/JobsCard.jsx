import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClipboardList, AlertTriangle, Loader, CheckCircle, Calendar } from "lucide-react";

const statusConfig = {
  Overdue: { icon: <AlertTriangle size={12} />, bg: "bg-red-100", text: "text-red-700", bar: "#ef4444" },
  "In Progress": { icon: <Loader size={12} />, bg: "bg-blue-100", text: "text-blue-700", bar: "#3b82f6" },
  Completed: { icon: <CheckCircle size={12} />, bg: "bg-emerald-100", text: "text-emerald-700", bar: "#10b981" },
  Scheduled: { icon: <Calendar size={12} />, bg: "bg-slate-100", text: "text-slate-600", bar: "#94a3b8" },
};

const priorityConfig = {
  Urgent: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Normal: "bg-slate-100 text-slate-600",
  Low: "bg-slate-50 text-slate-400",
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.Scheduled;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {status}
    </span>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700">{payload[0].payload.status}</p>
      <p>{payload[0].value} job{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function JobsCard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 bg-slate-200 rounded mb-2" />)}
      </div>
    );
  }

  const chartData = Object.entries(data.byStatus || {}).map(([status, count]) => ({ status, count }));
  const overdue = data.byStatus?.Overdue || 0;
  const activeJobs = data.jobs?.filter((j) => j.status !== "Completed").slice(0, 8) || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Task Tracker</h2>
          <p className="text-sm text-slate-500">Daily Jobs Overview</p>
        </div>
        {overdue > 0 ? (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <AlertTriangle size={12} />
            {overdue} Overdue
          </span>
        ) : (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
            On Schedule
          </span>
        )}
      </div>

      {/* Status bar chart */}
      <div>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
            <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={statusConfig[entry.status]?.bar || "#94a3b8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Job list */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
        {activeJobs.map((job) => (
          <div key={job.id} className="flex items-center justify-between text-sm gap-2 py-1.5 border-b border-slate-50">
            <div className="flex-1 min-w-0">
              <p className="text-slate-700 font-medium truncate">{job.title}</p>
              <p className="text-xs text-slate-400">{job.assignee} · Due {job.dueDate}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityConfig[job.priority] || priorityConfig.Normal}`}>
                {job.priority}
              </span>
              <StatusBadge status={job.status} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-right">Updated {data.lastUpdated}</p>
    </div>
  );
}
