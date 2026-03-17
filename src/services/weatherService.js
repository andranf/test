/**
 * SpecConnect Weather Station Service + Open-Meteo Forecast
 *
 * Endpoints used:
 *   GetCustomerEquipment          — auto-discover all device serials
 *   GetCurrentConditionsForEquipment — live sensor readings
 *   GetDataInDateTimeRange        — 14-day history for trend chart
 *   GetBatteryLevels              — station battery health
 *   GetSignalStrength             — station cellular/WiFi signal
 *   GetWindLogData                — high-frequency wind log
 *
 * Forecast: Open-Meteo (open-meteo.com) — free, no key required.
 */

const MOCK_MODE  = false;
const BASE_URL   = "https://api.specconnect.net:6703/api";
const API_KEY    = "bf4854edebefaaa9964c765ab3f0cf09";

// Ranfurlie Golf Club — Cranbourne West, Victoria
const COURSE_LAT = -38.1208;
const COURSE_LNG =  145.2481;

// ── Helpers ───────────────────────────────────────────────────────────────────

function q(params) {
  return Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

function isoDate(d) {
  return d.toISOString().slice(0, 19);
}

// ── Open-Meteo 3-day forecast ─────────────────────────────────────────────────

const WMO_ICONS = {
  0: "sun", 1: "sun", 2: "cloud", 3: "cloud",
  45: "cloud", 48: "cloud",
  51: "rain", 53: "rain", 55: "rain",
  61: "rain", 63: "rain", 65: "rain",
  71: "rain", 73: "rain", 75: "rain",
  80: "rain", 81: "rain", 82: "rain",
  95: "rain", 96: "rain", 99: "rain",
};

async function fetchForecast(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=4`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const { daily } = await res.json();
  return daily.time.slice(1, 4).map((dateStr, i) => {
    const d = new Date(dateStr + "T12:00:00");
    return {
      day:  i === 0 ? "Tomorrow" : d.toLocaleDateString([], { weekday: "short" }),
      high: Math.round(daily.temperature_2m_max[i + 1]),
      low:  Math.round(daily.temperature_2m_min[i + 1]),
      rain: `${daily.precipitation_probability_max[i + 1]}%`,
      icon: WMO_ICONS[daily.weathercode[i + 1]] ?? "cloud",
    };
  });
}

// ── SpecConnect response parser ───────────────────────────────────────────────
// GetCurrentConditionsForEquipment returns either a flat object of named fields
// or an array of {ChannelName, Value} channel records. Handle both.

function extractChannels(payload) {
  if (!payload) return {};
  // Channel array format: [{ChannelName:"AirTemperature", Value:22.5}, ...]
  if (Array.isArray(payload)) {
    return Object.fromEntries(payload.map(c => [
      c.ChannelName ?? c.Name ?? c.Key,
      c.Value ?? c.value,
    ]));
  }
  // Flat object: {AirTemperature:22.5, ...} or nested {Data:[...]}
  if (payload.Data)    return extractChannels(payload.Data);
  if (payload.Sensors) return extractChannels(payload.Sensors);
  return payload;
}

function getField(channels, ...keys) {
  for (const k of keys) {
    const v = channels[k] ?? channels[k.toLowerCase()] ?? channels[k.toUpperCase()];
    if (v != null && v !== "") return +v;
  }
  return null;
}

function mapReading(device, payload, forecast, history, battery, signal) {
  const ch = extractChannels(payload);

  const temperature  = getField(ch, "AirTemperature", "Temperature", "Temp", "TempC");
  const windSpeed    = getField(ch, "WindSpeed", "Wind", "WindSpeedKMH");
  const windDir      = ch.WindDirection ?? ch.WindDir ?? ch.WindDirectionDegrees ?? "—";
  const humidity     = getField(ch, "RelativeHumidity", "Humidity", "RH");
  const rainfall     = getField(ch, "Precipitation", "Rainfall", "Rain", "RainMM");
  const dewPoint     = getField(ch, "DewPoint", "DewPointC");
  const solarRad     = getField(ch, "SolarRadiation", "Solar", "SolarRad");
  const et           = getField(ch, "ET", "EvapoTranspiration", "EvapotranspirationMM");
  const pressure     = getField(ch, "BarometricPressure", "Pressure", "BaroPressure");
  const leafWetness  = getField(ch, "LeafWetness", "Wetness");

  // Derive a compass string if wind direction is numeric degrees
  const windDirStr = typeof windDir === "number" || (typeof windDir === "string" && !isNaN(+windDir))
    ? degreesToCompass(+windDir)
    : String(windDir);

  let conditions = "Clear";
  if (rainfall != null && rainfall > 2.5)         conditions = "Rainy";
  else if (humidity != null && humidity > 85)      conditions = "Humid / Overcast";
  else if (solarRad != null && solarRad < 200)     conditions = "Partly Cloudy";
  else if (solarRad != null && solarRad >= 200)    conditions = "Mostly Sunny";

  return {
    temperature:    temperature != null ? +temperature.toFixed(1) : null,
    humidity:       humidity    != null ? +humidity.toFixed(1)    : null,
    windSpeed:      windSpeed   != null ? +windSpeed.toFixed(1)   : null,
    windDirection:  windDirStr,
    rainfall:       rainfall    != null ? +rainfall.toFixed(1)    : null,
    dewPoint:       dewPoint    != null ? +dewPoint.toFixed(1)    : null,
    solarRadiation: solarRad    != null ? +solarRad.toFixed(0)    : null,
    et:             et          != null ? +et.toFixed(1)          : null,
    pressure:       pressure    != null ? +pressure.toFixed(1)    : null,
    leafWetness:    leafWetness != null ? +leafWetness.toFixed(1) : null,
    stationName:    device.Name ?? device.StationName ?? device.DeviceType ?? "Weather Station",
    lastUpdated:    new Date().toLocaleTimeString(),
    conditions,
    forecast,
    history,   // 14-day [{date, temp, rainfall, solar}]
    battery,   // 0–100 or null
    signal,    // dBm / % or null
  };
}

function degreesToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ── History parser (GetDataInDateTimeRange) ───────────────────────────────────

function mapHistory(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => {
    const ch   = extractChannels(row);
    const temp = getField(ch, "AirTemperature", "Temperature", "Temp");
    const rain = getField(ch, "Precipitation", "Rainfall", "Rain");
    const sol  = getField(ch, "SolarRadiation", "Solar");
    const rawDate = row.Date ?? row.ReadingDate ?? row.DateTime ?? row.Timestamp;
    const date = rawDate
      ? new Date(rawDate).toLocaleDateString([], { month: "short", day: "numeric" })
      : "—";
    return { date, temp, rainfall: rain, solar: sol };
  });
}

// ── Live fetch ────────────────────────────────────────────────────────────────

async function fetchLive() {
  // 1. Discover all devices — find the weather station serial automatically
  const equipRes = await fetch(`${BASE_URL}/Customer/GetCustomerEquipment?customerApiKey=${API_KEY}`);
  if (!equipRes.ok) throw new Error(`GetCustomerEquipment: ${equipRes.status}`);
  const equipment = await equipRes.json();

  const devices = Array.isArray(equipment) ? equipment : (equipment.Equipment ?? equipment.Devices ?? [equipment]);
  // Exclude FieldScout/TDR devices — they're handled by tdrService
  const weatherDevice = devices.find(e => {
    const type = String(e.DeviceType ?? e.Type ?? e.Model ?? "").toLowerCase();
    return !type.includes("tdr") && !type.includes("fieldscout") && !type.includes("trufirm");
  }) ?? devices[0];

  if (!weatherDevice) throw new Error("No weather station found in GetCustomerEquipment");

  const serial = weatherDevice.SerialNumber ?? weatherDevice.Serial ?? weatherDevice.serialNumber;
  const lat    = weatherDevice.Latitude  ?? weatherDevice.lat ?? COURSE_LAT;
  const lng    = weatherDevice.Longitude ?? weatherDevice.lon ?? COURSE_LNG;

  // 2. Parallel: current readings, 14-day history, battery, signal, forecast
  const now         = new Date();
  const fourteenAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const [currentRes, historyRes, batteryRes, signalRes, forecast] = await Promise.allSettled([
    fetch(`${BASE_URL}/Customer/GetCurrentConditionsForEquipment?${q({ customerApiKey: API_KEY, serialNumber: serial })}`),
    fetch(`${BASE_URL}/Customer/GetDataInDateTimeRange?${q({ customerApiKey: API_KEY, serialNumber: serial, startDate: isoDate(fourteenAgo), endDate: isoDate(now) })}`),
    fetch(`${BASE_URL}/Customer/GetBatteryLevels?${q({ customerApiKey: API_KEY, serialNumber: serial })}`),
    fetch(`${BASE_URL}/Customer/GetSignalStrength?${q({ customerApiKey: API_KEY, serialNumber: serial })}`),
    fetchForecast(lat, lng),
  ]);

  if (currentRes.status !== "fulfilled" || !currentRes.value.ok)
    throw new Error(`GetCurrentConditionsForEquipment: ${currentRes.value?.status ?? currentRes.reason}`);

  const reading = await currentRes.value.json();

  const history = (historyRes.status === "fulfilled" && historyRes.value.ok)
    ? mapHistory(await historyRes.value.json())
    : [];

  let battery = null;
  if (batteryRes.status === "fulfilled" && batteryRes.value.ok) {
    const b = await batteryRes.value.json();
    battery = b.BatteryLevel ?? b.Level ?? b.Percent ?? b.Value ?? (typeof b === "number" ? b : null);
  }

  let signal = null;
  if (signalRes.status === "fulfilled" && signalRes.value.ok) {
    const s = await signalRes.value.json();
    signal = s.SignalStrength ?? s.Strength ?? s.Level ?? s.Value ?? s.Rssi ?? (typeof s === "number" ? s : null);
  }

  const forecastData = forecast.status === "fulfilled" ? forecast.value : [];

  return mapReading(weatherDevice, reading, forecastData, history, battery, signal);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function getMockHistory() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const isRainDay = i === 1 || i === 12; // simulate two rain events
    return {
      date:     d.toLocaleDateString([], { month: "short", day: "numeric" }),
      temp:     +(28 - i * 0.5 + (Math.random() - 0.5) * 3).toFixed(1),
      rainfall: isRainDay ? +(8 + Math.random() * 18).toFixed(1) : +(Math.random() * 0.5).toFixed(1),
      solar:    +(550 + (Math.random() - 0.5) * 200).toFixed(0),
    };
  });
}

function getMockData() {
  const hour = new Date().getHours();
  const am   = hour < 10;
  return {
    temperature:    am ? 14.2 : 21.8,
    humidity:       am ? 82   : 56,
    windSpeed:      13.4,
    windDirection:  "SW",
    rainfall:       0.0,
    dewPoint:       am ? 9.1  : 13.4,
    solarRadiation: am ? 320  : 648,
    et:             3.8,
    pressure:       1013.4,
    leafWetness:    am ? 2.1  : 0.0,
    stationName:    "WatchDog 2000 — Ranfurlie",
    lastUpdated:    new Date().toLocaleTimeString(),
    conditions:     am ? "Partly Cloudy" : "Mostly Sunny",
    forecast: [
      { day: "Tomorrow", high: 24, low: 13, rain: "10%", icon: "sun"   },
      { day: "Wed",      high: 20, low: 11, rain: "30%", icon: "cloud" },
      { day: "Thu",      high: 17, low: 10, rain: "60%", icon: "rain"  },
    ],
    history:  getMockHistory(),
    battery:  78,
    signal:   -72,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchWeather() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("SpecConnect live fetch failed, falling back to mock:", err.message);
    const forecast = await fetchForecast(COURSE_LAT, COURSE_LNG).catch(() => []);
    return { ...getMockData(), stationName: "⚠ Live sensor unavailable", forecast };
  }
}
