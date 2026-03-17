/**
 * USGA Deacon Service — Ranfurlie Golf Club
 *
 * Measurement targets based on research for premium private club / parkland:
 *   • Green Speed (Stimpmeter): 10.0–11.5 ft = ~3.05–3.51 m for premium private
 *   • Firmness (Clegg Impact): 110–130 GV target; 85–145 GV acceptable range
 *       (R&A/STRI parkland championship: 120–140 GV; higher = firmer + faster)
 *   • Turf Quality (NTEP scale): 7.5 target (1–9 scale)
 *   • Organic Matter: <4% at 25 mm depth for USGA sand profile
 *   • Soil Moisture (VWC): 18–24% target for USGA sand; wilt onset ~8–12%
 *
 * Note: 4th green is currently out of play (reconstruction Feb 2026).
 *
 * TODO: Set MOCK_MODE = false and configure BASE_URL + API_KEY.
 */

const MOCK_MODE = true;
const BASE_URL  = "https://your-usga-deacon-endpoint.com/api"; // TODO
const API_KEY   = "YOUR_API_KEY";                               // TODO

async function fetchLive() {
  const response = await fetch(`${BASE_URL}/measurements?key=${API_KEY}`);
  if (!response.ok) throw new Error(`USGA API error: ${response.status}`);
  return response.json();
}

// ── Metric definitions with correct agronomic targets ─────────────────────────

const METRICS = [
  {
    // 10.0–11.5 ft for premium private daily; 11.5–13 ft tournament
    // 3.05–3.51 m daily; 3.51–3.96 m tournament
    name:   "Green Speed (Stimp)",
    unit:   "m",
    target: 3.2,
    min:    2.85,
    max:    3.6,
  },
  {
    // R&A/STRI parkland target: 110–130 GV daily; 120–140 GV championship
    // Clegg values drop ~15–25 GV for every 2–3% VWC increase
    name:   "Firmness (Clegg)",
    unit:   "GV",
    target: 120,
    min:    85,
    max:    145,
  },
  {
    // NTEP 1–9 visual turf quality; 7.5 = good commercial standard
    name:   "Turf Quality",
    unit:   "TQ",
    target: 7.5,
    min:    6.0,
    max:    9.0,
  },
  {
    // USGA sand profile: target <4% OM at 25 mm depth
    name:   "Organic Matter",
    unit:   "%",
    target: 3.2,
    min:    1.5,
    max:    5.0,
  },
  {
    // USGA sand: 18–24% target; <12% wilt risk; >25% field capacity (soft)
    name:   "Soil Moisture",
    unit:   "%",
    target: 21,
    min:    12,
    max:    26,
  },
];

function getMockData() {
  const metrics = METRICS.map(m => {
    const value       = +(m.target + (Math.random() - 0.5) * (m.max - m.min) * 0.4).toFixed(1);
    const withinRange = value >= m.min && value <= m.max;
    const nearTarget  = Math.abs(value - m.target) < (m.max - m.min) * 0.12;
    const status      = !withinRange ? "out-of-range" : nearTarget ? "on-target" : "in-range";
    return { ...m, value, status };
  });

  // 14-day green speed history
  const history = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date:     d.toLocaleDateString([], { month:"short", day:"numeric" }),
      stimp:    +(3.2 + (Math.random() - 0.5) * 0.38).toFixed(2),
      firmness: +(120 + (Math.random() - 0.5) * 24).toFixed(0),
    };
  });

  return {
    metrics,
    history,
    lastMeasured: "Today, 7:30 AM",
    measuredBy:   "A. Anderson",  // Supt. Andrew Anderson
    course:       "18-hole Championship",
  };
}

export async function fetchUSGA() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
