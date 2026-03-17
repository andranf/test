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

const MOCK_MODE = false;

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

const CREW = ["Mike R.", "Sarah L.", "Tom B.", "Jake M.", "Chris P.", "Dana K."];
const CATEGORIES = ["Mowing", "Irrigation", "Fertilization", "Aeration", "Topdressing", "Bunker", "Tree Work", "Equipment"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const LOCATIONS = ["Hole 1-6", "Hole 7-12", "Hole 13-18", "Practice Green", "Driving Range", "Clubhouse Grounds", "Maintenance Area"];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getMockData() {
  const jobs = Array.from({ length: 20 }, (_, i) => {
    const r = Math.random();
    const status = r < 0.15 ? "Overdue" : r < 0.35 ? "In Progress" : r < 0.55 ? "Completed" : "Scheduled";
    const due = new Date();
    if (status === "Overdue") due.setDate(due.getDate() - Math.floor(Math.random() * 3 + 1));
    else if (status === "Scheduled") due.setDate(due.getDate() + Math.floor(Math.random() * 7 + 1));
    const category = randomItem(CATEGORIES);
    return {
      id: `JOB-${1000 + i}`,
      title: `${category} — ${randomItem(LOCATIONS)}`,
      category,
      assignee: randomItem(CREW),
      status,
      statusColor: statusColor(status),
      priority: randomItem(PRIORITIES),
      dueDate: due.toLocaleDateString([], { month: "short", day: "numeric" }),
      estimatedHours: +(Math.random() * 4 + 0.5).toFixed(1),
    };
  });
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
