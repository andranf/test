/**
 * USGA Deacon Service
 *
 * TODO: Replace MOCK_MODE with real USGA Deacon credentials.
 * USGA Deacon exposes course measurement data via its web portal/API.
 * Set MOCK_MODE = false and configure BASE_URL + credentials.
 */

const MOCK_MODE = true;
const BASE_URL = "https://your-usga-deacon-endpoint.com/api"; // TODO: replace
const API_KEY = "YOUR_API_KEY"; // TODO: replace

async function fetchLive() {
  const response = await fetch(`${BASE_URL}/measurements?key=${API_KEY}`);
  if (!response.ok) throw new Error(`USGA API error: ${response.status}`);
  const data = await response.json();
  return data;
}

const METRICS = [
  {
    name: "Green Speed (Stimp)",
    unit: "ft",
    target: 10.5,
    min: 9.5,
    max: 11.5,
  },
  {
    name: "Firmness",
    unit: "Clegg",
    target: 75,
    min: 60,
    max: 100,
  },
  {
    name: "Turf Quality",
    unit: "TQ",
    target: 7.5,
    min: 6.0,
    max: 9.0,
  },
  {
    name: "Organic Matter",
    unit: "%",
    target: 3.5,
    min: 2.0,
    max: 5.0,
  },
  {
    name: "Soil Moisture",
    unit: "%",
    target: 22,
    min: 15,
    max: 30,
  },
];

function getMockData() {
  const metrics = METRICS.map((m) => {
    const value = +(m.target + (Math.random() - 0.5) * (m.max - m.min) * 0.5).toFixed(1);
    const withinRange = value >= m.min && value <= m.max;
    const nearTarget = Math.abs(value - m.target) < (m.max - m.min) * 0.1;
    const status = !withinRange ? "out-of-range" : nearTarget ? "on-target" : "in-range";
    return { ...m, value, status };
  });

  const history = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      stimp: +(10.5 + (Math.random() - 0.5) * 1.5).toFixed(1),
      firmness: +(75 + (Math.random() - 0.5) * 20).toFixed(0),
    };
  });

  return {
    metrics,
    history,
    lastMeasured: "Today, 7:30 AM",
    measuredBy: "J. Thompson",
    course: "18-hole Championship",
  };
}

export async function fetchUSGA() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
