/**
 * ASB TaskTracker Service (by Clubessential)
 *
 * ASB TaskTracker does not publish its API docs publicly. The API key is wired in
 * and endpoints follow the most common pattern for their platform.
 *
 * IF REQUESTS FAIL: open the ASB web app, open browser DevTools → Network tab,
 * perform any action, and note the request URL/headers — then update BASE_URL below.
 *
 * Set MOCK_MODE = true to use generated data while the live endpoint is confirmed.
 */

const MOCK_MODE = true; // TODO: set false once BASE_URL is confirmed via ASB DevTools inspection

// TODO: confirm BASE_URL by inspecting the ASB web app's network requests
const BASE_URL = "https://api.asbtasktracker.com/api/v1";
const API_KEY = "f94958be-aa6f-11ee-9eec-3cecef7b602d";

const AUTH_HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

/** Map an ASB task object → our internal shape */
function mapTask(t) {
  // ASB field names based on their UI labels — adjust if actual keys differ
  const statusRaw = t.status ?? t.Status ?? t.taskStatus ?? "";
  const status = normalizeStatus(statusRaw);
  return {
    id: t.id ?? t.taskId ?? t.ID,
    title: t.title ?? t.name ?? t.taskName ?? "Untitled Task",
    category: t.category ?? t.type ?? t.taskType ?? "General",
    assignee: formatAssignee(t.assignedTo ?? t.assignee ?? t.employee),
    status,
    statusColor: statusColor(status),
    priority: normalizePriority(t.priority ?? t.Priority),
    dueDate: formatDate(t.dueDate ?? t.due ?? t.scheduledDate),
    estimatedHours: t.estimatedHours ?? t.hours ?? null,
  };
}

function normalizeStatus(raw) {
  const s = String(raw).toLowerCase();
  if (s.includes("overdue") || s.includes("late")) return "Overdue";
  if (s.includes("progress") || s.includes("active") || s.includes("started")) return "In Progress";
  if (s.includes("complete") || s.includes("done") || s.includes("finished")) return "Completed";
  return "Scheduled";
}

function normalizePriority(raw) {
  const p = String(raw ?? "").toLowerCase();
  if (p.includes("urgent") || p === "4") return "Urgent";
  if (p.includes("high") || p === "3") return "High";
  if (p.includes("low") || p === "1") return "Low";
  return "Normal";
}

function formatAssignee(val) {
  if (!val) return "Unassigned";
  if (typeof val === "string") return val;
  return `${val.firstName ?? ""} ${(val.lastName ?? "")[0] ?? ""}.`.trim();
}

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString([], { month: "short", day: "numeric" });
}

function statusColor(status) {
  return { Overdue: "red", "In Progress": "blue", Completed: "green", Scheduled: "gray" }[status] || "gray";
}

async function fetchLive() {
  // Fetch today's tasks — try /tasks endpoint first, then /workorders as fallback
  const today = new Date().toISOString().slice(0, 10);
  let res = await fetch(`${BASE_URL}/tasks?date=${today}&limit=100`, { headers: AUTH_HEADERS });

  if (res.status === 404) {
    // Try alternate endpoint name
    res = await fetch(`${BASE_URL}/workorders?date=${today}&limit=100`, { headers: AUTH_HEADERS });
  }
  if (!res.ok) throw new Error(`ASB API error: ${res.status} ${res.statusText}`);

  const payload = await res.json();
  // Handle both array and wrapped response shapes
  const raw = Array.isArray(payload) ? payload : (payload.tasks ?? payload.data ?? payload.items ?? []);
  const jobs = raw.map(mapTask);

  const byStatus = {
    Overdue: jobs.filter((j) => j.status === "Overdue").length,
    "In Progress": jobs.filter((j) => j.status === "In Progress").length,
    Completed: jobs.filter((j) => j.status === "Completed").length,
    Scheduled: jobs.filter((j) => j.status === "Scheduled").length,
  };

  return { jobs, byStatus, lastUpdated: new Date().toLocaleTimeString() };
}

// ── Mock data (used when MOCK_MODE = true) ────────────────────────────────────
// Source: March Greens Report (Notion, 11 Mar 2026) + current Greenkeeper data.
// Context: Hosting Div 1 pennant; 4th hole opens Apr 10; 37.3mm rain Feb 16–Mar 10;
// ET deficit -311.59mm; whole-course bunker refresh (Option B) approved;
// Clip/Greenkeeper data gaps flagged as operational risk.

function dueIn(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
const TODAY = new Date().toLocaleDateString([], { month: "short", day: "numeric" });

function getMockData() {
  const jobs = [
    // ── In Progress ───────────────────────────────────────────────────────────
    {
      id: "JOB-1001",
      title: "Greens mow & roll — all 18 holes",
      category: "Mowing",
      assignee: "Mike R.",
      status: "In Progress",
      statusColor: statusColor("In Progress"),
      priority: "High",
      dueDate: TODAY,
      estimatedHours: 3.5,
    },
    {
      id: "JOB-1002",
      title: "4th hole — topdress & plugging (pennant prep)",
      category: "Topdressing",
      assignee: "Sarah L.",
      status: "In Progress",
      statusColor: statusColor("In Progress"),
      priority: "Urgent",
      dueDate: TODAY,
      estimatedHours: 3.0,
    },
    {
      id: "JOB-1003",
      title: "Bunker refresh — shale patch & sand top-up (Holes 1–9)",
      category: "Bunker",
      assignee: "Tom B.",
      status: "In Progress",
      statusColor: statusColor("In Progress"),
      priority: "High",
      dueDate: TODAY,
      estimatedHours: 5.0,
    },
    // ── Scheduled ─────────────────────────────────────────────────────────────
    {
      id: "JOB-1004",
      title: "PGR application — greens & approaches (Primo/Ethephon)",
      category: "PGR",
      assignee: "Dana K.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "High",
      dueDate: dueIn(1),
      estimatedHours: 2.5,
    },
    {
      id: "JOB-1005",
      title: "Bunker refresh — geofabric removal & sand (Holes 10–18)",
      category: "Bunker",
      assignee: "Tom B.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "High",
      dueDate: dueIn(2),
      estimatedHours: 5.0,
    },
    {
      id: "JOB-1006",
      title: "4th hole — left greenside bunker rebuild",
      category: "Bunker",
      assignee: "Jake M.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "Urgent",
      dueDate: dueIn(2),
      estimatedHours: 6.0,
    },
    {
      id: "JOB-1007",
      title: "Irrigation head trim — all greens surrounds",
      category: "Irrigation",
      assignee: "Chris P.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "Normal",
      dueDate: dueIn(3),
      estimatedHours: 4.0,
    },
    {
      id: "JOB-1008",
      title: "Couch surrounds fertilise & topdress — 4th hole",
      category: "Fertilization",
      assignee: "Sarah L.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "Normal",
      dueDate: dueIn(4),
      estimatedHours: 2.0,
    },
    {
      id: "JOB-1009",
      title: "Drainage trial review — pipe-to-rock pilot sites",
      category: "Other",
      assignee: "Mike R.",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "Normal",
      dueDate: dueIn(5),
      estimatedHours: 2.5,
    },
    {
      id: "JOB-1010",
      title: "Sand order confirm — 350–400m³ for bunker refresh",
      category: "Other",
      assignee: "A. Anderson",
      status: "Scheduled",
      statusColor: statusColor("Scheduled"),
      priority: "Urgent",
      dueDate: dueIn(1),
      estimatedHours: 1.0,
    },
    // ── Completed today ────────────────────────────────────────────────────────
    {
      id: "JOB-1011",
      title: "Hole cup change — all 18",
      category: "Other",
      assignee: "Chris P.",
      status: "Completed",
      statusColor: statusColor("Completed"),
      priority: "Normal",
      dueDate: TODAY,
      estimatedHours: 1.5,
    },
    {
      id: "JOB-1012",
      title: "Clipping volume log — greens (Greenkeeper app entry)",
      category: "Mowing",
      assignee: "Dana K.",
      status: "Completed",
      statusColor: statusColor("Completed"),
      priority: "Normal",
      dueDate: TODAY,
      estimatedHours: 0.5,
    },
    {
      id: "JOB-1013",
      title: "Morning ET & irrigation check",
      category: "Irrigation",
      assignee: "Jake M.",
      status: "Completed",
      statusColor: statusColor("Completed"),
      priority: "Normal",
      dueDate: TODAY,
      estimatedHours: 0.5,
    },
    // ── Overdue ────────────────────────────────────────────────────────────────
    {
      id: "JOB-1014",
      title: "Clip data QA — backfill missing Greenkeeper entries",
      category: "Other",
      assignee: "A. Anderson",
      status: "Overdue",
      statusColor: statusColor("Overdue"),
      priority: "Urgent",
      dueDate: dueIn(-3),
      estimatedHours: 2.0,
    },
    {
      id: "JOB-1015",
      title: "Reel grind & bedknife set — No. 3 greens mower",
      category: "Equipment",
      assignee: "Tom B.",
      status: "Overdue",
      statusColor: statusColor("Overdue"),
      priority: "High",
      dueDate: dueIn(-1),
      estimatedHours: 3.0,
    },
  ];

  const byStatus = {
    Overdue: jobs.filter((j) => j.status === "Overdue").length,
    "In Progress": jobs.filter((j) => j.status === "In Progress").length,
    Completed: jobs.filter((j) => j.status === "Completed").length,
    Scheduled: jobs.filter((j) => j.status === "Scheduled").length,
  };
  return { jobs, byStatus, lastUpdated: new Date().toLocaleTimeString() };
}

export async function fetchJobs() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("ASB TaskTracker live fetch failed, falling back to mock:", err.message);
    return getMockData();
  }
}
