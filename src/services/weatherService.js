/**
 * Spectrum Weather Station Service
 *
 * TODO: Replace MOCK_MODE with real Spectrum API credentials.
 * Spectrum stations typically expose data via a REST API or cloud dashboard.
 * Set MOCK_MODE = false and fill in BASE_URL + API_KEY to go live.
 */

const MOCK_MODE = true;
const BASE_URL = "https://your-spectrum-api-endpoint.com/api"; // TODO: replace
const API_KEY = "YOUR_API_KEY"; // TODO: replace

function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range * 2).toFixed(1);
}

async function fetchLive() {
  const response = await fetch(`${BASE_URL}/current?key=${API_KEY}`);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  const data = await response.json();
  // Map real API response to the shape below
  return {
    temperature: data.temp_f,
    humidity: data.humidity,
    windSpeed: data.wind_mph,
    windDirection: data.wind_dir,
    rainfall: data.rain_in,
    dewPoint: data.dew_point_f,
    solarRadiation: data.solar_radiation,
    stationName: data.station_name,
    lastUpdated: new Date(data.timestamp).toLocaleTimeString(),
    conditions: data.conditions,
    forecast: data.forecast || [],
  };
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
  return fetchLive();
}
