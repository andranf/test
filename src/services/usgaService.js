/**
 * USGA Deacon Service — Ranfurlie Golf Club
 *
 * Measurement targets based on research for premium private club / parkland:
 *   • Green Speed (Stimpmeter): 10.0–11.5 ft daily; 11.5–13.0 ft tournament
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

// ── Metric definitions ────────────────────────────────────────────────────────
// min/max define the acceptable agronomic range (used for gauge fill normalisation)

const METRICS = [
  {
    // Stimpmeter in FEET — standard for AU/NZ golf club reporting
    // Daily target 10.5 ft; 9.0–12.0 ft acceptable; tournament ≥12.0 ft
    name:   "Green Speed (Stimp)",
    unit:   "ft",
    target: 10.5,
    min:    9.0,
    max:    12.0,
  },
  {
    // Clegg Impact Value — R&A/STRI parkland target 110–130 GV daily
    // Drops ~15–25 GV per 2–3% VWC increase; post-rain values commonly 90–105 GV
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
    // USGA sand profile: target <4% OM at 25 mm depth — lower is better
    name:   "Organic Matter",
    unit:   "%",
    target: 3.2,
    min:    1.5,
    max:    5.0,
  },
  {
    // USGA sand: 18–24% VWC target; <12% wilt risk; >25% field capacity (soft)
    name:   "Soil Moisture",
    unit:   "%",
    target: 21,
    min:    12,
    max:    26,
  },
];

// ── Status helper ─────────────────────────────────────────────────────────────

function calcStatus(value, m) {
  if (value < m.min || value > m.max) return "out-of-range";
  if (Math.abs(value - m.target) < (m.max - m.min) * 0.12) return "on-target";
  return "in-range";
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Fixed values reflecting current Ranfurlie conditions (mid-March 2026):
//   • Post 25mm rain event (Feb 28) — greens still soft, VWC elevated
//   • PGR suppression gap (Feb 22–26) caused clipping flush → slightly slower speeds
//   • Autumn approach: growth moderating, OM slightly elevated post-summer
//   • 4th green out of play — readings from 17 greens

function getMockData() {
  const readings = {
    "Green Speed (Stimp)": 10.2,  // below target; clipping flush + soft conditions
    "Firmness (Clegg)":    103,   // below target (110–130); post-rain softness
    "Turf Quality":        7.2,   // solid; slight stress from wet/flush period
    "Organic Matter":      3.8,   // high side of target; elevated post-summer
    "Soil Moisture":       23.5,  // above target 21%; post-rain field capacity
  };

  const metrics = METRICS.map(m => {
    const value = readings[m.name];
    return { ...m, value, status: calcStatus(value, m) };
  });

  // 14-day history with a realistic narrative:
  //   Mar 3–6:  pre-flush, firm & fast (good stimp ~11.0 ft, firmness ~122 GV)
  //   Mar 7–10: PGR flush recovery, speeds slow to ~10.4 ft
  //   Mar 11:   Feb 28 rain effects fully felt — firmness drops to ~95 GV
  //   Mar 12–17: gradual recovery; VWC draining, speeds rebuilding
  const historyData = [
    { stimp: 11.0, firmness: 122 },  // Mar 3
    { stimp: 11.1, firmness: 124 },  // Mar 4
    { stimp: 10.9, firmness: 121 },  // Mar 5
    { stimp: 10.8, firmness: 119 },  // Mar 6
    { stimp: 10.5, firmness: 115 },  // Mar 7 — flush begins
    { stimp: 10.3, firmness: 110 },  // Mar 8
    { stimp: 10.1, firmness: 104 },  // Mar 9 — rain event effect
    { stimp:  9.8, firmness:  95 },  // Mar 10 — softest point
    { stimp:  9.9, firmness:  97 },  // Mar 11
    { stimp: 10.0, firmness: 100 },  // Mar 12 — recovery begins
    { stimp: 10.1, firmness: 101 },  // Mar 13
    { stimp: 10.2, firmness: 102 },  // Mar 14
    { stimp: 10.1, firmness: 101 },  // Mar 15 — light shower
    { stimp: 10.2, firmness: 103 },  // Mar 16
    { stimp: 10.2, firmness: 103 },  // Mar 17 — today
  ];

  const history = historyData.map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (14 - i));
    return {
      date:     date.toLocaleDateString([], { month: "short", day: "numeric" }),
      stimp:    d.stimp,
      firmness: d.firmness,
    };
  });

  return {
    metrics,
    history,
    lastMeasured: "Today, 7:30 AM",
    measuredBy:   "A. Anderson",
    course:       "18-hole Championship (17 greens)",
  };
}

export async function fetchUSGA() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
