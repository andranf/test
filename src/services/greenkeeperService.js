/**
 * Greenkeeper App Service
 *
 * TODO: Replace MOCK_MODE with real Greenkeeper API credentials.
 * Greenkeeper typically exposes data via REST or SOAP depending on version.
 * Set MOCK_MODE = false and configure BASE_URL + credentials.
 */

const MOCK_MODE = true;
const BASE_URL = "https://your-greenkeeper-instance.com/api"; // TODO: replace
const AUTH_TOKEN = "YOUR_TOKEN"; // TODO: replace

async function fetchLive() {
  const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
  const [stressRes, irrigationRes, coursesRes] = await Promise.all([
    fetch(`${BASE_URL}/stress`, { headers }),
    fetch(`${BASE_URL}/irrigation/schedule`, { headers }),
    fetch(`${BASE_URL}/courses`, { headers }),
  ]);
  const stress = await stressRes.json();
  const irrigation = await irrigationRes.json();
  const courses = await coursesRes.json();
  // Map real API response to the shape below
  return { stress, irrigation, courses };
}

const ZONES = [
  "Fairways",
  "Greens",
  "Tees",
  "Rough",
  "Surrounds",
];

const STATUS = ["Good", "Moderate", "Stressed", "Critical"];

function randomStatus() {
  const weights = [0.5, 0.3, 0.15, 0.05];
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return STATUS[i];
  }
  return STATUS[0];
}

function statusColor(status) {
  return { Good: "green", Moderate: "yellow", Stressed: "orange", Critical: "red" }[status] || "gray";
}

function getMockData() {
  const zones = ZONES.map((name) => {
    const status = randomStatus();
    return {
      name,
      status,
      color: statusColor(status),
      moisture: +(Math.random() * 40 + 20).toFixed(1),
      et: +(Math.random() * 0.25 + 0.05).toFixed(2),
      lastIrrigated: `${Math.floor(Math.random() * 48) + 1}h ago`,
    };
  });

  const nextRun = new Date();
  nextRun.setHours(4, 30, 0, 0);
  if (nextRun < new Date()) nextRun.setDate(nextRun.getDate() + 1);

  return {
    zones,
    irrigation: {
      nextRun: nextRun.toLocaleString([], { hour: "2-digit", minute: "2-digit", weekday: "short" }),
      totalZones: 18,
      activeZones: Math.floor(Math.random() * 3),
      estimatedRuntime: "2h 45m",
    },
    alerts: zones
      .filter((z) => z.status === "Stressed" || z.status === "Critical")
      .map((z) => ({ zone: z.name, message: `${z.status} stress detected`, severity: z.color })),
  };
}

export async function fetchGreenkeeper() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
