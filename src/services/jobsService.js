/**
 * Task Tracker / Jobs Service
 *
 * TODO: Replace MOCK_MODE with your task tracker's API.
 * Common integrations: Golf Genius, EZLinks, Club Essentials, or a custom system.
 * Set MOCK_MODE = false and configure BASE_URL + credentials.
 */

const MOCK_MODE = true;
const BASE_URL = "https://your-task-tracker.com/api"; // TODO: replace
const API_KEY = "YOUR_API_KEY"; // TODO: replace

async function fetchLive() {
  const response = await fetch(`${BASE_URL}/jobs?status=all&limit=50`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!response.ok) throw new Error(`Jobs API error: ${response.status}`);
  return response.json();
}

const CREW = ["Mike R.", "Sarah L.", "Tom B.", "Jake M.", "Chris P.", "Dana K."];
const CATEGORIES = ["Mowing", "Irrigation", "Fertilization", "Aeration", "Topdressing", "Bunker", "Tree Work", "Equipment"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const LOCATIONS = [
  "Hole 1-6", "Hole 7-12", "Hole 13-18",
  "Practice Green", "Driving Range", "Clubhouse Grounds", "Maintenance Area",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStatus(overduePct = 0.15) {
  const r = Math.random();
  if (r < overduePct) return "Overdue";
  if (r < 0.35) return "In Progress";
  if (r < 0.55) return "Completed";
  return "Scheduled";
}

function statusColor(status) {
  return {
    Overdue: "red",
    "In Progress": "blue",
    Completed: "green",
    Scheduled: "gray",
  }[status] || "gray";
}

function getMockData() {
  const jobs = Array.from({ length: 20 }, (_, i) => {
    const status = randomStatus();
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
  return fetchLive();
}
