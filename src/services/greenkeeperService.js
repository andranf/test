/**
 * Greenkeeper App Service — Ranfurlie Golf Club
 *
 * Surfaces turf health data for two grass types:
 *   • Creeping Bentgrass (Agrostis stolonifera) — Greens & Tees
 *       Optimal VWC: 18–26%  |  Optimal soil temp: 15–24°C
 *       Disease risk: Dollar Spot (18–32°C + RH > 85%), Brown Patch (>28°C night + RH > 90%)
 *   • Wintergreen Couch (Cynodon dactylon 'Wintergreen') — Fairways, Surrounds & Rough
 *       Optimal VWC: 20–32%  |  Active growth: soil temp > 18°C
 *       Dormancy risk: soil temp < 15°C (common May–Sep at Berwick, VIC)
 *       Disease risk: Spring Dead Spot (post-dormancy recovery)
 *
 * TODO: Replace MOCK_MODE = false and configure BASE_URL + credentials.
 */

const MOCK_MODE = true;
const BASE_URL  = "https://your-greenkeeper-instance.com/api"; // TODO
const AUTH_TOKEN = "YOUR_TOKEN";                               // TODO

async function fetchLive() {
  const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
  const [stressRes, irrigationRes] = await Promise.all([
    fetch(`${BASE_URL}/stress`,             { headers }),
    fetch(`${BASE_URL}/irrigation/schedule`,{ headers }),
  ]);
  const stress     = await stressRes.json();
  const irrigation = await irrigationRes.json();
  return { stress, irrigation };
}

// ── Zone definitions ──────────────────────────────────────────────────────────

const ZONES = [
  { name: "Greens",     type: "bentgrass", icon: "⛳", targetMin: 18, targetMax: 26 },
  { name: "Tees",       type: "bentgrass", icon: "🏌️", targetMin: 18, targetMax: 26 },
  { name: "Fairways",   type: "couch",     icon: "🌿", targetMin: 20, targetMax: 32 },
  { name: "Surrounds",  type: "couch",     icon: "🌿", targetMin: 20, targetMax: 32 },
  { name: "Rough",      type: "couch",     icon: "🌾", targetMin: 18, targetMax: 35 },
];

// ── Status helpers ────────────────────────────────────────────────────────────

function moistureStatus(vwc, zone) {
  const { targetMin, targetMax } = zone;
  if (vwc < targetMin - 4) return { status: "Critical",  color: "red"    };
  if (vwc < targetMin)     return { status: "Stressed",  color: "orange" };
  if (vwc > targetMax + 4) return { status: "Saturated", color: "orange" };
  if (vwc > targetMax)     return { status: "Moist",     color: "yellow" };
  return                          { status: "Good",      color: "green"  };
}

/**
 * Bentgrass heat stress index (0–100).
 * Combines air temperature and humidity into a simple stress score.
 */
export function bentgrassStressIndex(tempC, humidity) {
  let stress = 0;
  if      (tempC > 35) stress += 55;
  else if (tempC > 30) stress += 30 + (tempC - 30) * 5;
  else if (tempC > 26) stress += (tempC - 26) * 7.5;
  else if (tempC <  5) stress += 45;
  else if (tempC < 10) stress += 25;
  if      (humidity > 90) stress += 25;
  else if (humidity > 80) stress += 12;
  return Math.min(100, Math.round(stress));
}

/**
 * Dollar Spot risk level.
 * High risk: 18–32°C + RH > 85%
 */
export function dollarSpotRisk(tempC, humidity) {
  if (tempC >= 18 && tempC <= 32 && humidity >= 90) return "High";
  if (tempC >= 16 && tempC <= 34 && humidity >= 80) return "Moderate";
  return "Low";
}

/**
 * Couch dormancy status based on soil temperature.
 * At Berwick VIC, typically dormant May–Sep.
 */
export function couchDormancyStatus(soilTempC) {
  if (soilTempC <  12) return { label: "Dormant",      color: "slate"  };
  if (soilTempC <  16) return { label: "Transitioning", color: "yellow" };
  if (soilTempC <  20) return { label: "Slow Growth",  color: "yellow" };
  return                      { label: "Active",       color: "green"  };
}

// ── Mock data generator ───────────────────────────────────────────────────────

function getMockData() {
  // Simulate current season (March = early autumn in Berwick VIC)
  const month = new Date().getMonth(); // 0-based
  const isSummer  = month >= 11 || month <= 1;
  const isWinter  = month >= 5  && month <= 8;
  const soilTemp  = isSummer ? +(24 + Math.random() * 6).toFixed(1)
                  : isWinter ? +(11 + Math.random() * 4).toFixed(1)
                  :            +(17 + Math.random() * 5).toFixed(1);
  const airTemp   = soilTemp + (Math.random() - 0.4) * 4;
  const humidity  = +(45 + Math.random() * 40).toFixed(0);

  const zones = ZONES.map((z) => {
    const moisture = +(z.targetMin + Math.random() * (z.targetMax - z.targetMin + 12) - 4).toFixed(1);
    const { status, color } = moistureStatus(moisture, z);
    return {
      name: z.name,
      type: z.type,
      icon: z.icon,
      moisture: Math.max(5, moisture),
      targetMin: z.targetMin,
      targetMax: z.targetMax,
      status,
      color,
      et: +(Math.random() * 0.22 + 0.04).toFixed(2),
      soilTemp: +(soilTemp + (Math.random() - 0.5) * 2).toFixed(1),
      lastIrrigated: `${Math.floor(Math.random() * 36) + 1}h ago`,
    };
  });

  const nextRun = new Date();
  nextRun.setHours(4, 30, 0, 0);
  if (nextRun < new Date()) nextRun.setDate(nextRun.getDate() + 1);

  const alerts = zones
    .filter(z => z.status === "Stressed" || z.status === "Critical")
    .map(z => ({ zone: z.name, message: `${z.status} — moisture ${z.moisture}% VWC`, severity: z.color }));

  // Computed intelligence
  const bsi    = bentgrassStressIndex(airTemp, humidity);
  const dsr    = dollarSpotRisk(airTemp, humidity);
  const couch  = couchDormancyStatus(soilTemp);

  return {
    zones,
    soilTemp,
    airTemp: +airTemp.toFixed(1),
    humidity,
    bentgrassStressIndex: bsi,
    dollarSpotRisk: dsr,
    couchDormancy: couch,
    irrigation: {
      nextRun:          nextRun.toLocaleString([], { hour: "2-digit", minute: "2-digit", weekday: "short" }),
      totalZones:       18,
      activeZones:      Math.floor(Math.random() * 3),
      estimatedRuntime: "2h 45m",
    },
    alerts,
  };
}

export async function fetchGreenkeeper() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
