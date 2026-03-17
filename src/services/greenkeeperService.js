/**
 * Greenkeeper App Service — Ranfurlie Golf Club
 * 825 Cranbourne Frankston Road, Cranbourne West VIC 3977
 * Superintendent: Andrew Anderson
 *
 * Two grass types managed on site:
 *
 *   • Creeping Bentgrass (Agrostis stolonifera) — Greens & Tees
 *       Optimal VWC (USGA sand): 18–24%  |  Wilt onset: 6–12%
 *       Root stress onset: soil temp >20°C  |  Root growth ceases: >25°C
 *       Shoot growth ceases: >32°C  |  Dormancy: <5°C
 *       Dollar Spot: 15–30°C air + prolonged leaf wetness (>10 hrs dew/fog)
 *                    Drought-stressed turf MORE susceptible
 *       Brown Patch: night temp >20°C + RH >80% — peak Jan–Mar
 *       Pythium Blight: day >29°C + wet night, spreads 24–48 hrs
 *       Mowing height: 3.5–4.5 mm daily; 2.5–3.2 mm tournament
 *
 *   • Legend Couch (Cynodon dactylon) — Fairways, Surrounds & Rough
 *       VGA-recommended variety; seeded common couch
 *       Optimal VWC: 20–30%  |  Active growth: soil temp >18°C
 *       Dormancy: soil temp <10–15°C (June–Aug at Cranbourne)
 *       Spring Dead Spot infection: soil temp declining through <21°C (March–April)
 *       SDS highest risk: thatch >12 mm, late-season N, poor drainage
 *       Mowing height: 10–15 mm fairways (peak), raise to 18–22 mm pre-dormancy
 *       Note: Rough being converted to creeping fescue (>75,000 m² seeded to date)
 *
 *   Recent works: 4th green reconstructed Feb 2026 following contamination
 *
 * TODO: Set MOCK_MODE = false and configure BASE_URL + credentials.
 */

const MOCK_MODE = true;
const BASE_URL   = "https://your-greenkeeper-instance.com/api"; // TODO
const AUTH_TOKEN = "YOUR_TOKEN";                                // TODO

async function fetchLive() {
  const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
  const [stressRes, irrigationRes] = await Promise.all([
    fetch(`${BASE_URL}/stress`,              { headers }),
    fetch(`${BASE_URL}/irrigation/schedule`, { headers }),
  ]);
  return { stress: await stressRes.json(), irrigation: await irrigationRes.json() };
}

// ── Zone definitions with correct agronomic targets ───────────────────────────

const ZONES = [
  // VWC targets: bentgrass 18–24% USGA sand; wilt onset ~8%
  { name: "Greens",     type: "bentgrass", targetMin: 18, targetMax: 24 },
  { name: "Tees",       type: "bentgrass", targetMin: 18, targetMax: 24 },
  // Legend couch: 20–30% active growth, 8–12% during dormancy
  { name: "Fairways",   type: "couch",     targetMin: 20, targetMax: 30 },
  { name: "Surrounds",  type: "couch",     targetMin: 20, targetMax: 30 },
  { name: "Rough",      type: "fescue",    targetMin: 18, targetMax: 32 }, // converting to fescue
];

// ── Status helpers ────────────────────────────────────────────────────────────

function moistureStatus(vwc, zone) {
  const { targetMin, targetMax } = zone;
  // Bentgrass wilt onset ~8–12%; couch can tolerate lower before wilt
  const wiltThreshold = zone.type === "bentgrass" ? 10 : 14;
  if (vwc <= wiltThreshold)      return { status: "Wilt Risk",  color: "red"    };
  if (vwc < targetMin - 3)       return { status: "Critical",   color: "red"    };
  if (vwc < targetMin)           return { status: "Stressed",   color: "orange" };
  if (vwc > targetMax + 4)       return { status: "Saturated",  color: "orange" };
  if (vwc > targetMax)           return { status: "Moist",      color: "yellow" };
  return                                { status: "Good",       color: "green"  };
}

/**
 * Bentgrass heat/stress index (0–100).
 * Based on soil temperature (critical threshold) + humidity.
 * Research: root growth ceases >25°C soil; shoot ceases >32°C.
 * Nighttime lows >21°C air are the most reliable early indicator.
 */
/**
 * Turfgrass Growth Potential (GP) — PACE Turf / Gaussian model.
 *
 * GP = exp(-0.5 × ((T - T_opt) / σ)²)  → returns 0–100
 *
 * C3 cool-season (bentgrass, ryegrass, poa):
 *   T_opt = 20°C, σ = 5.5°C  → peak growth 15–24°C
 * C4 warm-season (couch/bermuda):
 *   T_opt = 31°C, σ = 7.5°C  → peak growth 26–35°C
 *
 * Use average air temperature (mean of max/min) for daily GP,
 * or current air temp for a real-time estimate.
 */
export function growthPotential(tempC) {
  const c3 = Math.round(Math.exp(-0.5 * Math.pow((tempC - 20) / 5.5, 2)) * 100);
  const c4 = Math.round(Math.exp(-0.5 * Math.pow((tempC - 31) / 7.5, 2)) * 100);
  return {
    c3,  // bentgrass / poa / ryegrass
    c4,  // couch / bermuda / kikuyu
    c3Label: c3 >= 75 ? "High" : c3 >= 40 ? "Moderate" : "Low",
    c4Label: c4 >= 75 ? "High" : c4 >= 40 ? "Moderate" : "Low",
  };
}

export function bentgrassStressIndex(tempC, humidity) {
  let stress = 0;
  // Temperature stress — soil temps estimated roughly 1–3°C below air
  const estSoilTemp = tempC - 2;
  if      (estSoilTemp > 28) stress += 60;
  else if (estSoilTemp > 25) stress += 35 + (estSoilTemp - 25) * 8;
  else if (estSoilTemp > 20) stress += (estSoilTemp - 20) * 7;
  else if (estSoilTemp <  5) stress += 45;
  else if (estSoilTemp < 10) stress += 22;
  // Humidity/disease pressure
  if      (humidity > 90) stress += 20;
  else if (humidity > 80) stress += 10;
  return Math.min(100, Math.round(stress));
}

/**
 * Dollar Spot risk.
 * Peak 15–30°C air temp + prolonged leaf wetness (dew, fog, high humidity).
 * IMPORTANT: drought-stressed turf is MORE susceptible — not saturated.
 * Low nitrogen also dramatically increases incidence.
 */
export function dollarSpotRisk(tempC, humidity) {
  const inTempRange = tempC >= 15 && tempC <= 30;
  if (inTempRange && humidity >= 90) return "High";
  if (inTempRange && humidity >= 78) return "Moderate";
  if (inTempRange && humidity >= 65) return "Low–Moderate";
  return "Low";
}

/**
 * Brown Patch risk (Rhizoctonia solani).
 * Daytime >27°C, nighttime lows >20°C, RH sustained >80%.
 * Peak Melbourne risk: January–March.
 */
export function brownPatchRisk(tempC, humidity) {
  if (tempC > 27 && humidity >= 85) return "High";
  if (tempC > 24 && humidity >= 80) return "Moderate";
  return "Low";
}

/**
 * Spring Dead Spot risk for Legend Couch.
 * Infection occurs in autumn as soil temp drops through 21°C (March–April).
 * Higher risk with thatch >12 mm, late-season N, poor drainage.
 */
export function springDeadSpotRisk(soilTempC, month) {
  // month 0-based; March=2, April=3
  const isAutumn = month >= 2 && month <= 4;
  if (isAutumn && soilTempC <= 21 && soilTempC >= 10) return "High";
  if (isAutumn && soilTempC <= 24) return "Moderate";
  return "Low";
}

/**
 * Legend Couch dormancy status (soil temp at 10 cm).
 * At Cranbourne: dormant June–Aug (~8–12°C); recovery Sep–Oct.
 */
export function couchDormancyStatus(soilTempC) {
  if (soilTempC <  10) return { label: "Dormant",       color: "red"    };
  if (soilTempC <  15) return { label: "Transitioning", color: "orange" };
  if (soilTempC <  18) return { label: "Slow Growth",   color: "yellow" };
  return                      { label: "Active",        color: "green"  };
}

// ── Mock data generator ───────────────────────────────────────────────────────

function getMockData() {
  // Season simulation for Cranbourne VIC
  const month = new Date().getMonth(); // 0-based
  const isSummer = month >= 11 || month <= 1;  // Dec–Feb
  const isAutumn = month >= 2  && month <= 4;  // Mar–May
  const isWinter = month >= 5  && month <= 7;  // Jun–Aug

  const soilTemp = isSummer ? +(22 + Math.random() * 6).toFixed(1)
                 : isWinter ? +(9  + Math.random() * 3).toFixed(1)
                 :             +(16 + Math.random() * 5).toFixed(1);
  const airTemp  = soilTemp + +(Math.random() * 4 - 1).toFixed(1);
  const humidity = +(45 + Math.random() * 40).toFixed(0);

  const zones = ZONES.map(z => {
    const spread  = z.targetMax - z.targetMin;
    const moisture = +(z.targetMin - 3 + Math.random() * (spread + 8)).toFixed(1);
    const clamped  = Math.max(6, moisture);
    return {
      ...moistureStatus(clamped, z),
      name:         z.name,
      type:         z.type,
      moisture:     clamped,
      targetMin:    z.targetMin,
      targetMax:    z.targetMax,
      et:           +(Math.random() * 0.22 + 0.04).toFixed(2),
      soilTemp:     +(soilTemp + (Math.random() - 0.5) * 1.5).toFixed(1),
      lastIrrigated:`${Math.floor(Math.random() * 36) + 1}h ago`,
    };
  });

  const nextRun = new Date();
  nextRun.setHours(4, 30, 0, 0);
  if (nextRun < new Date()) nextRun.setDate(nextRun.getDate() + 1);

  const alerts = zones
    .filter(z => z.status === "Stressed" || z.status === "Critical" || z.status === "Wilt Risk")
    .map(z => ({ zone: z.name, message: `${z.status} — VWC ${z.moisture}%`, severity: z.color }));

  return {
    zones,
    soilTemp,
    airTemp:              +airTemp.toFixed(1),
    humidity:             +humidity,
    bentgrassStressIndex: bentgrassStressIndex(airTemp, humidity),
    dollarSpotRisk:       dollarSpotRisk(airTemp, humidity),
    brownPatchRisk:       brownPatchRisk(airTemp, humidity),
    springDeadSpotRisk:   springDeadSpotRisk(soilTemp, month),
    couchDormancy:        couchDormancyStatus(soilTemp),
    irrigation: {
      nextRun:          nextRun.toLocaleString([], { hour:"2-digit", minute:"2-digit", weekday:"short" }),
      totalZones:       18,
      activeZones:      Math.floor(Math.random() * 3),
      estimatedRuntime: "2h 45m",
    },
    alerts,
    courseNews: "4th green re-seeded Feb 2026 — expected full play Sep 2026",
  };
}

export async function fetchGreenkeeper() {
  if (MOCK_MODE) return getMockData();
  return fetchLive();
}
