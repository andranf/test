/**
 * SpecConnect FieldScout TDR 350 Service — Ranfurlie Golf Club
 *
 * Endpoints used:
 *   GetCustomerEquipment    — discover TDR device serial numbers
 *   GetFSCollections        — discover FieldScout collection names (e.g. "Ranfurlie")
 *   GetFSDataInDateRange    — TDR readings by deviceType + collection + date range
 *                             (preferred — no serial number config needed)
 *   GetDataByDate           — fallback: readings for a specific device by date
 *
 * The FieldScout approach (GetFSDataInDateRange) is preferred because it returns
 * all TDR readings across the collection (greens), labelled by area name, without
 * needing to configure individual device serial numbers.
 */

const MOCK_MODE       = false;
const BASE_URL        = "https://api.specconnect.net:6703/api";
const API_KEY         = "bf4854edebefaaa9964c765ab3f0cf09";

// deviceType as recognised by GetFSDataInDateRange — try TDR350 first
const TDR_DEVICE_TYPE = "TDR350";

// Fallback: set to TDR serial number printed on device if FieldScout approach fails
// (visible in FieldScout Mobile app under Device Info)
const TDR_SERIAL_FALLBACK = "YOUR_TDR_SERIAL";

// VWC thresholds (USGA sand greens)
const VWC_LOW    = 16;
const VWC_TARGET = 21;
const VWC_HIGH   = 24;

// ── Helpers ───────────────────────────────────────────────────────────────────

function q(params) {
  return Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Response parser ───────────────────────────────────────────────────────────

function parseReading(raw, index) {
  const get = (...keys) => {
    for (const k of keys) {
      const v = raw[k] ?? raw[k.toLowerCase()] ?? raw[k.toUpperCase()];
      if (v != null && v !== "") return +v;
    }
    return null;
  };

  const vwc   = get("VWC", "SoilMoisture", "WaterContent", "Moisture");
  const ec    = get("EC", "BulkEC", "SoilEC", "ElectricalConductivity");
  const temp  = get("SoilTemperature", "SoilTemp", "Temperature");
  const lat   = get("Latitude", "Lat");
  const lng   = get("Longitude", "Lon", "Long");

  // Area label: prefer FieldScout area name, fall back to GPS or index
  const label =
    raw.AreaName    ?? raw.areaName    ??
    raw.SubAreaName ?? raw.subAreaName ??
    raw.Location    ?? raw.location    ??
    raw.Name        ?? raw.name        ??
    (lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : `Reading ${index + 1}`);

  const rawDate =
    raw.ReadingDate ?? raw.Date ?? raw.Timestamp ?? raw.DateTime ?? raw.Time ?? null;

  const time = rawDate
    ? new Date(rawDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return { label, vwc, ec, temp, lat, lng, rawDate: time };
}

function summarise(readings) {
  const valid = readings.filter(r => r.vwc != null);
  if (!valid.length) return null;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    avgVWC:  +avg(valid.map(r => r.vwc)).toFixed(1),
    minVWC:  +Math.min(...valid.map(r => r.vwc)).toFixed(1),
    maxVWC:  +Math.max(...valid.map(r => r.vwc)).toFixed(1),
    avgEC:   valid.some(r => r.ec   != null) ? +avg(valid.filter(r => r.ec   != null).map(r => r.ec)).toFixed(2)  : null,
    avgTemp: valid.some(r => r.temp != null) ? +avg(valid.filter(r => r.temp != null).map(r => r.temp)).toFixed(1) : null,
    count:   valid.length,
    wetWatch: valid.filter(r => r.vwc > VWC_HIGH).length,
    dryWatch: valid.filter(r => r.vwc < VWC_LOW).length,
  };
}

// ── Live fetch — FieldScout collection approach ───────────────────────────────

async function fetchViaFSCollections() {
  // 1. Discover collection names
  const colRes = await fetch(`${BASE_URL}/Customer/GetFSCollections?customerApiKey=${API_KEY}`);
  if (!colRes.ok) throw new Error(`GetFSCollections: ${colRes.status}`);
  const colData = await colRes.json();

  // Collections may be an array of strings or objects
  const collections = Array.isArray(colData) ? colData : (colData.Collections ?? colData.Data ?? []);
  const collectionName = typeof collections[0] === "string"
    ? collections[0]
    : collections[0]?.Name ?? collections[0]?.CollectionName ?? collections[0]?.name;

  if (!collectionName) throw new Error("No FieldScout collections found");

  // 2. Fetch today's TDR readings
  const today = todayString();
  const dataRes = await fetch(
    `${BASE_URL}/Customer/GetFSDataInDateRange?${q({
      customerApiKey: API_KEY,
      deviceType:     TDR_DEVICE_TYPE,
      startDate:      today,
      endDate:        today,
      collectionName,
    })}`
  );
  if (!dataRes.ok) throw new Error(`GetFSDataInDateRange: ${dataRes.status}`);
  const payload = await dataRes.json();

  const raw = Array.isArray(payload) ? payload : (payload.Data ?? payload.Readings ?? payload.Values ?? []);
  return { raw, collectionName };
}

async function fetchViaSerial() {
  if (!TDR_SERIAL_FALLBACK || TDR_SERIAL_FALLBACK === "YOUR_TDR_SERIAL") {
    // Try auto-discovering TDR serial from equipment list
    const equipRes = await fetch(`${BASE_URL}/Customer/GetCustomerEquipment?customerApiKey=${API_KEY}`);
    if (!equipRes.ok) throw new Error(`GetCustomerEquipment: ${equipRes.status}`);
    const equipment = await equipRes.json();
    const devices   = Array.isArray(equipment) ? equipment : (equipment.Equipment ?? []);
    const tdrDevice = devices.find(e =>
      String(e.DeviceType ?? e.Type ?? "").toLowerCase().includes("tdr")
    );
    if (!tdrDevice) throw new Error("No TDR device found via GetCustomerEquipment");
    const serial = tdrDevice.SerialNumber ?? tdrDevice.Serial;
    const dataRes = await fetch(`${BASE_URL}/Customer/GetDataByDate?${q({ customerApiKey: API_KEY, serialNumber: serial, date: todayString() })}`);
    if (!dataRes.ok) throw new Error(`GetDataByDate: ${dataRes.status}`);
    const payload = await dataRes.json();
    const raw = Array.isArray(payload) ? payload : (payload.Data ?? payload.Readings ?? [payload]);
    return { raw, collectionName: null };
  }
  const dataRes = await fetch(`${BASE_URL}/Customer/GetDataByDate?${q({ customerApiKey: API_KEY, serialNumber: TDR_SERIAL_FALLBACK, date: todayString() })}`);
  if (!dataRes.ok) throw new Error(`GetDataByDate: ${dataRes.status}`);
  const payload = await dataRes.json();
  const raw = Array.isArray(payload) ? payload : (payload.Data ?? payload.Readings ?? [payload]);
  return { raw, collectionName: null };
}

async function fetchLive() {
  let raw, collectionName;
  try {
    ({ raw, collectionName } = await fetchViaFSCollections());
  } catch (fsErr) {
    console.warn("FieldScout collection approach failed, trying serial fallback:", fsErr.message);
    ({ raw, collectionName } = await fetchViaSerial());
  }

  const readings = raw.map((r, i) => parseReading(r, i));
  return {
    readings,
    summary: summarise(readings),
    collectionName,
    date:        todayString(),
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Realistic per-green VWC for mid-March 2026 Ranfurlie:
//   post 37.3mm rain period — moisture elevated across course
//   4th green excluded (reconstruction); greens 2, 7, 9 = wet watch

function getMockData() {
  const base = new Date();
  const t = (h, m) => {
    const d = new Date(base); d.setHours(h, m, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const readings = [
    { label:"Green 1",  vwc:22.8, ec:0.38, temp:18.9, rawDate:t(6,45) },
    { label:"Green 2",  vwc:27.1, ec:0.41, temp:18.5, rawDate:t(6,52) },
    { label:"Green 3",  vwc:23.5, ec:0.36, temp:19.1, rawDate:t(6,58) },
    { label:"Green 5",  vwc:21.9, ec:0.34, temp:19.4, rawDate:t(7, 5) },
    { label:"Green 6",  vwc:23.2, ec:0.37, temp:19.0, rawDate:t(7,11) },
    { label:"Green 7",  vwc:26.4, ec:0.43, temp:18.7, rawDate:t(7,18) },
    { label:"Green 8",  vwc:22.1, ec:0.35, temp:19.3, rawDate:t(7,24) },
    { label:"Green 9",  vwc:25.8, ec:0.40, temp:18.8, rawDate:t(7,30) },
    { label:"Green 10", vwc:22.6, ec:0.36, temp:19.2, rawDate:t(7,38) },
    { label:"Green 11", vwc:23.9, ec:0.39, temp:18.9, rawDate:t(7,44) },
    { label:"Green 12", vwc:20.4, ec:0.33, temp:19.6, rawDate:t(7,50) },
    { label:"Green 13", vwc:24.1, ec:0.38, temp:18.8, rawDate:t(7,56) },
    { label:"Green 14", vwc:23.0, ec:0.36, temp:19.1, rawDate:t(8, 2) },
    { label:"Green 15", vwc:24.8, ec:0.41, temp:18.7, rawDate:t(8, 8) },
    { label:"Green 16", vwc:19.8, ec:0.32, temp:19.8, rawDate:t(8,14) },
    { label:"Green 17", vwc:23.3, ec:0.37, temp:19.0, rawDate:t(8,20) },
    { label:"Green 18", vwc:22.5, ec:0.35, temp:19.2, rawDate:t(8,26) },
  ];
  return {
    readings,
    summary:         summarise(readings),
    collectionName:  "Ranfurlie",
    date:            todayString(),
    lastUpdated:     t(8, 26),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchTDR() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("TDR live fetch failed, falling back to mock:", err.message);
    return getMockData();
  }
}
