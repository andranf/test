/**
 * Spectrum Connect Weather Station Service + Open-Meteo Forecast
 *
 * Live sensor data: Spectrum Connect REST API (api.specconnect.net)
 * 3-day forecast:   Open-Meteo (open-meteo.com) — free, no key required
 *
 * Set MOCK_MODE = true to use generated data instead (e.g. for local dev).
 *
 * COURSE_LAT / COURSE_LNG: update these to your course's coordinates.
 * The app will try to read lat/lon from the Spectrum station record first;
 * these values are used as the fallback for the forecast call.
 */

const MOCK_MODE = false;
const BASE_URL = "https://api.specconnect.net/api";
const API_KEY = "bf4854edebefaaa9964c765ab3f0cf09";

// Fallback coordinates used for the forecast if the station doesn't return lat/lon
// TODO: update to your course's actual coordinates
const COURSE_LAT = 39.8283;
const COURSE_LNG = -98.5795;

// ── Open-Meteo forecast ───────────────────────────────────────────────────────

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
  const data = await res.json();
  const { daily } = data;

  return daily.time.slice(1, 4).map((dateStr, i) => {
    const d = new Date(dateStr + "T12:00:00");
    const label = i === 0 ? "Tomorrow"
      : d.toLocaleDateString([], { weekday: "short" });
    return {
      day: label,
      high: Math.round(daily.temperature_2m_max[i + 1]),
      low: Math.round(daily.temperature_2m_min[i + 1]),
      rain: `${daily.precipitation_probability_max[i + 1]}%`,
      icon: WMO_ICONS[daily.weathercode[i + 1]] ?? "cloud",
    };
  });
}

// ── Spectrum Connect sensor data ──────────────────────────────────────────────

function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range * 2).toFixed(1);
}

function mapReading(station, reading, forecast) {
  const get = (key) => reading?.[key]?.Value ?? reading?.[key] ?? null;

  const tempF       = get("AirTemperature") ?? get("Temperature");
  const windSpeed   = get("WindSpeed");
  const windDir     = get("WindDirection");
  const humidity    = get("RelativeHumidity") ?? get("Humidity");
  const rainfall    = get("Precipitation") ?? get("Rainfall") ?? get("Rain");
  const dewPoint    = get("DewPoint");
  const solarRad    = get("SolarRadiation") ?? get("Solar");

  let conditions = "Clear";
  if (rainfall > 0.1)   conditions = "Rainy";
  else if (humidity > 85) conditions = "Humid / Overcast";
  else if (solarRad < 200) conditions = "Partly Cloudy";
  else                    conditions = "Mostly Sunny";

  return {
    temperature:    tempF     != null ? +tempF.toFixed(1)     : null,
    humidity:       humidity  != null ? +humidity.toFixed(1)  : null,
    windSpeed:      windSpeed != null ? +windSpeed.toFixed(1) : null,
    windDirection:  windDir ?? "—",
    rainfall:       rainfall  != null ? +rainfall.toFixed(2)  : null,
    dewPoint:       dewPoint  != null ? +dewPoint.toFixed(1)  : null,
    solarRadiation: solarRad  != null ? +solarRad.toFixed(0)  : null,
    stationName:    station.StationName ?? station.Name ?? "Weather Station",
    lastUpdated:    new Date().toLocaleTimeString(),
    conditions,
    forecast,
  };
}

async function fetchLive() {
  // 1. Station list
  const stationsRes = await fetch(
    `${BASE_URL}/Customer/GetStations?customerApiKey=${API_KEY}`
  );
  if (!stationsRes.ok) throw new Error(`Spectrum API error: ${stationsRes.status}`);
  const stations = await stationsRes.json();
  if (!stations?.length) throw new Error("No Spectrum stations found for this account");

  const station   = stations[0];
  const stationId = station.StationId ?? station.ID ?? station.Id;
  const lat       = station.Latitude  ?? station.lat ?? COURSE_LAT;
  const lng       = station.Longitude ?? station.lon ?? COURSE_LNG;

  // 2. Fetch sensor data + forecast in parallel
  const now         = new Date();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
  const fmt         = (d) => d.toISOString().slice(0, 19);

  const [dataRes, forecast] = await Promise.all([
    fetch(
      `${BASE_URL}/Customer/GetHourlyData?customerApiKey=${API_KEY}` +
      `&stationId=${stationId}&startDate=${fmt(twoHoursAgo)}&endDate=${fmt(now)}`
    ),
    fetchForecast(lat, lng),
  ]);

  if (!dataRes.ok) throw new Error(`Spectrum data error: ${dataRes.status}`);
  const readings = await dataRes.json();
  const latest   = Array.isArray(readings) ? readings[readings.length - 1] : readings;

  return mapReading(station, latest, forecast);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function getMockData() {
  const hour = new Date().getHours();
  const isMorning = hour < 10;
  return {
    temperature:    randomVariation(isMorning ? 14 : 22, 2),
    humidity:       randomVariation(isMorning ? 82 : 55, 5),
    windSpeed:      randomVariation(13, 6),
    windDirection:  "SW",
    rainfall:       randomVariation(3.0, 1.2),
    dewPoint:       randomVariation(isMorning ? 9 : 13, 2),
    solarRadiation: randomVariation(isMorning ? 320 : 650, 50),
    stationName:    "Station 1 - Clubhouse",
    lastUpdated:    new Date().toLocaleTimeString(),
    conditions:     isMorning ? "Partly Cloudy" : "Mostly Sunny",
    forecast: [
      { day: "Tomorrow", high: 24, low: 13, rain: "10%", icon: "sun" },
      { day: "Wed",      high: 20, low: 11, rain: "30%", icon: "cloud" },
      { day: "Thu",      high: 17, low: 10, rain: "60%", icon: "rain" },
    ],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchWeather() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("Spectrum live fetch failed, falling back to mock:", err.message);
    // Still try to attach a real forecast even in fallback mode
    const forecast = await fetchForecast(COURSE_LAT, COURSE_LNG).catch(() => []);
    return { ...getMockData(), stationName: "⚠ Live sensor unavailable", forecast };
  }
}

export async function fetchStations() {
  const res = await fetch(`${BASE_URL}/Customer/GetStations?customerApiKey=${API_KEY}`);
  if (!res.ok) throw new Error(`Spectrum API error: ${res.status}`);
  return res.json();
}
