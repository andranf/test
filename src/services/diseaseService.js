/**
 * SpecConnect Disease Model Service — Ranfurlie Golf Club
 *
 * Endpoint: GET api/Customer/GetDiseaseModelReport
 *   ?customerApiKey={key}&name={modelName}&optUnits={optUnits}&xs={xs}
 *
 * Returns CSV-formatted disease model data. The targeted Disease Model must be
 * "shared" in your SpecConnect account. To see available shared models, log into
 * SpecConnect → Disease Models → check which models are marked as Shared.
 *
 * Models attempted (most relevant for bentgrass/couch golf greens in Victoria):
 *   - Dollar Spot    (Sclerotinia homoeocarpa — #1 bentgrass disease risk)
 *   - Brown Patch    (Rhizoctonia solani — warm/humid conditions)
 *   - Pythium Blight (Pythium spp. — hot humid nights, rapidly destructive)
 *
 * MOCK_MODE = true until shared model names are confirmed in the account.
 * To activate: set MOCK_MODE = false and verify DISEASE_MODELS names match
 * exactly what's configured as shared in SpecConnect.
 */

const MOCK_MODE = true;
const BASE_URL  = "https://api.specconnect.net:6703/api";
const API_KEY   = "bf4854edebefaaa9964c765ab3f0cf09";

// Model names must match exactly what's set as "shared" in SpecConnect.
// Update these once you've confirmed the shared model names in your account.
const DISEASE_MODELS = [
  { key: "dollarSpot",    name: "Dollar Spot",    description: "Sclerotinia homoeocarpa — bentgrass" },
  { key: "brownPatch",    name: "Brown Patch",    description: "Rhizoctonia solani — warm/humid"     },
  { key: "pythiumBlight", name: "Pythium Blight", description: "Pythium spp. — hot humid nights"     },
];

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function toRiskLevel(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("high") || s === "3" || +s >= 70)     return "High";
  if (s.includes("mod")  || s === "2" || +s >= 40)     return "Moderate";
  if (s.includes("low")  || s === "1" || +s <  40)     return "Low";
  return "Low";
}

function latestRow(rows) {
  if (!rows.length) return null;
  // Rows are usually sorted ascending — take last
  return rows[rows.length - 1];
}

function parseModel(csv, modelKey) {
  const rows = parseCSV(csv);
  if (!rows.length) return null;

  const last = latestRow(rows);
  const keys  = Object.keys(last);

  // Find risk/index column (varies by model)
  const riskKey  = keys.find(k => /risk|index|level|dsi|value/i.test(k));
  const dateKey  = keys.find(k => /date|time/i.test(k));
  const tempKey  = keys.find(k => /temp/i.test(k));
  const humKey   = keys.find(k => /hum|rh/i.test(k));

  const rawRisk  = riskKey  ? last[riskKey]  : null;
  const rawDate  = dateKey  ? last[dateKey]  : null;
  const rawTemp  = tempKey  ? last[tempKey]  : null;
  const rawHum   = humKey   ? last[humKey]   : null;

  // Build 7-day trend from last 7 rows
  const trend = rows.slice(-7).map(r => ({
    date:  r[dateKey] ? new Date(r[dateKey]).toLocaleDateString([], { month: "short", day: "numeric" }) : "—",
    risk:  toRiskLevel(riskKey ? r[riskKey] : null),
    value: riskKey ? +r[riskKey] || null : null,
  }));

  return {
    key:        modelKey,
    risk:       toRiskLevel(rawRisk),
    value:      rawRisk != null ? +rawRisk || null : null,
    date:       rawDate ? new Date(rawDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "Today",
    conditions: { temp: rawTemp ? +rawTemp : null, humidity: rawHum ? +rawHum : null },
    trend,
  };
}

// ── Live fetch ────────────────────────────────────────────────────────────────

async function fetchLive() {
  const results = await Promise.allSettled(
    DISEASE_MODELS.map(async m => {
      const res = await fetch(
        `${BASE_URL}/Customer/GetDiseaseModelReport?customerApiKey=${API_KEY}&name=${encodeURIComponent(m.name)}`
      );
      if (!res.ok) throw new Error(`${m.name}: ${res.status}`);
      const csv  = await res.text();
      const data = parseModel(csv, m.key);
      return { ...m, ...data };
    })
  );

  const models = results
    .filter(r => r.status === "fulfilled" && r.value)
    .map(r => r.value);

  if (!models.length) throw new Error("No disease models returned — check that models are set to 'Shared' in SpecConnect");

  return { models, lastUpdated: new Date().toLocaleTimeString() };
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Mid-March 2026 Ranfurlie: coming off hot/wet summer, humidity elevated post-rain.
// Dollar Spot: Moderate-High risk (warm days 20–24°C, humid nights, dew present)
// Brown Patch: Low-Moderate (temps dropping off 28°C+ peak)
// Pythium:     Low (nights cooling below 20°C as autumn sets in)

function getMockData() {
  const buildTrend = (risks) => risks.map((risk, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { date: d.toLocaleDateString([], { month: "short", day: "numeric" }), risk, value: null };
  });

  return {
    models: [
      {
        key:         "dollarSpot",
        name:        "Dollar Spot",
        description: "Sclerotinia homoeocarpa — bentgrass",
        risk:        "High",
        value:       74,
        date:        "Today",
        conditions:  { temp: 21.8, humidity: 82 },
        trend:       buildTrend(["Moderate","Moderate","High","High","High","High","High"]),
      },
      {
        key:         "brownPatch",
        name:        "Brown Patch",
        description: "Rhizoctonia solani — warm/humid",
        risk:        "Moderate",
        value:       48,
        date:        "Today",
        conditions:  { temp: 21.8, humidity: 82 },
        trend:       buildTrend(["High","High","Moderate","Moderate","Moderate","Low","Moderate"]),
      },
      {
        key:         "pythiumBlight",
        name:        "Pythium Blight",
        description: "Pythium spp. — hot humid nights",
        risk:        "Low",
        value:       18,
        date:        "Today",
        conditions:  { temp: 21.8, humidity: 82 },
        trend:       buildTrend(["Low","Low","Low","Low","Low","Low","Low"]),
      },
    ],
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchDisease() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("Disease model fetch failed, falling back to mock:", err.message);
    return getMockData();
  }
}
