/**
 * Spectrum Connect Weather Station Service
 *
 * Live integration with the Spectrum Connect API.
 * Set MOCK_MODE = true to use generated data instead (e.g. for local dev).
 *
 * API docs: https://api.specconnect.net/api/help
 */

const MOCK_MODE = false;
const BASE_URL = "https://api.specconnect.net/api";
const API_KEY = "bf4854edebefaaa9964c765ab3f0cf09";

function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range * 2).toFixed(1);
}

/** Map Spectrum Connect reading fields → our internal shape */
function mapReading(station, reading) {
  const get = (key) => reading?.[key]?.Value ?? reading?.[key] ?? null;

  const tempF = get("AirTemperature") ?? get("Temperature");
  const windSpeed = get("WindSpeed");
  const windDir = get("WindDirection");
  const humidity = get("RelativeHumidity") ?? get("Humidity");
  const rainfall = get("Precipitation") ?? get("Rainfall") ?? get("Rain");
  const dewPoint = get("DewPoint");
  const solarRad = get("SolarRadiation") ?? get("Solar");

  // Derive a simple "conditions" label from available data
  let conditions = "Clear";
  if (rainfall > 0.1) conditions = "Rainy";
  else if (humidity > 85) conditions = "Humid / Overcast";
  else if (solarRad < 200) conditions = "Partly Cloudy";
  else conditions = "Mostly Sunny";

  return {
    temperature: tempF != null ? +tempF.toFixed(1) : null,
    humidity: humidity != null ? +humidity.toFixed(1) : null,
    windSpeed: windSpeed != null ? +windSpeed.toFixed(1) : null,
    windDirection: windDir ?? "—",
    rainfall: rainfall != null ? +rainfall.toFixed(2) : null,
    dewPoint: dewPoint != null ? +dewPoint.toFixed(1) : null,
    solarRadiation: solarRad != null ? +solarRad.toFixed(0) : null,
    stationName: station.StationName ?? station.Name ?? "Weather Station",
    lastUpdated: new Date().toLocaleTimeString(),
    conditions,
    forecast: [], // Spectrum Connect doesn't provide forecast; wire a separate service if needed
  };
}

async function fetchLive() {
  // 1. Get list of stations
  const stationsRes = await fetch(
    `${BASE_URL}/Customer/GetStations?customerApiKey=${API_KEY}`
  );
  if (!stationsRes.ok) throw new Error(`Spectrum API error: ${stationsRes.status}`);
  const stations = await stationsRes.json();

  if (!stations || stations.length === 0) {
    throw new Error("No Spectrum stations found for this account");
  }

  // Use the first station (or pick the one most relevant to course ops)
  const station = stations[0];
  const stationId = station.StationId ?? station.ID ?? station.Id;

  // 2. Get the latest hourly reading (last 2 hours to ensure we have data)
  const now = new Date();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"

  const dataRes = await fetch(
    `${BASE_URL}/Customer/GetHourlyData?customerApiKey=${API_KEY}&stationId=${stationId}&startDate=${fmt(twoHoursAgo)}&endDate=${fmt(now)}`
  );
  if (!dataRes.ok) throw new Error(`Spectrum data error: ${dataRes.status}`);
  const readings = await dataRes.json();

  // Take the most recent reading
  const latest = Array.isArray(readings) ? readings[readings.length - 1] : readings;

  return mapReading(station, latest);
}

function getMockData() {
  const hour = new Date().getHours();
  const isMorning = hour < 10;
  return {
    temperature: randomVariation(isMorning ? 58 : 72, 3),
    humidity: randomVariation(isMorning ? 82 : 55, 5),
    windSpeed: randomVariation(8, 4),
    windDirection: "SW",
    rainfall: randomVariation(0.12, 0.05),
    dewPoint: randomVariation(48, 3),
    solarRadiation: randomVariation(isMorning ? 320 : 650, 50),
    stationName: "Station 1 - Clubhouse",
    lastUpdated: new Date().toLocaleTimeString(),
    conditions: isMorning ? "Partly Cloudy" : "Mostly Sunny",
    forecast: [
      { day: "Today", high: 75, low: 55, rain: "10%", icon: "sun" },
      { day: "Tomorrow", high: 68, low: 52, rain: "30%", icon: "cloud" },
      { day: "Wed", high: 63, low: 50, rain: "60%", icon: "rain" },
    ],
  };
}

export async function fetchWeather() {
  if (MOCK_MODE) return getMockData();
  try {
    return await fetchLive();
  } catch (err) {
    console.warn("Spectrum live fetch failed, falling back to mock:", err.message);
    // Return mock data so the card still renders if the API is temporarily unavailable
    return { ...getMockData(), stationName: "⚠ Live data unavailable" };
  }
}

/** Expose all stations for use in a station-picker if needed */
export async function fetchStations() {
  const res = await fetch(`${BASE_URL}/Customer/GetStations?customerApiKey=${API_KEY}`);
  if (!res.ok) throw new Error(`Spectrum API error: ${res.status}`);
  return res.json();
}
