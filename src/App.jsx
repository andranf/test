import { useState, useEffect, useCallback, useRef } from "react";
import "./index.css";
import WeatherCard from "./components/WeatherCard";
import GreenkeeperCard from "./components/GreenkeeperCard";
import USGACard from "./components/USGACard";
import JobsCard from "./components/JobsCard";
import StatusBar from "./components/StatusBar";
import { fetchWeather } from "./services/weatherService";
import { fetchGreenkeeper } from "./services/greenkeeperService";
import { fetchUSGA } from "./services/usgaService";
import { fetchJobs } from "./services/jobsService";

const REFRESH_INTERVAL = 120; // seconds

function useDataFetch() {
  const [weather, setWeather] = useState(null);
  const [greenkeeper, setGreenkeeper] = useState(null);
  const [usga, setUSGA] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetchWeather(),
      fetchGreenkeeper(),
      fetchUSGA(),
      fetchJobs(),
    ]);

    const newErrors = {};
    if (results[0].status === "fulfilled") setWeather(results[0].value);
    else newErrors.weather = results[0].reason?.message;

    if (results[1].status === "fulfilled") setGreenkeeper(results[1].value);
    else newErrors.greenkeeper = results[1].reason?.message;

    if (results[2].status === "fulfilled") setUSGA(results[2].value);
    else newErrors.usga = results[2].reason?.message;

    if (results[3].status === "fulfilled") setJobs(results[3].value);
    else newErrors.jobs = results[3].reason?.message;

    setErrors(newErrors);
    setLoading(false);
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setCountdown(REFRESH_INTERVAL);
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL * 1000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  // Countdown display
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : REFRESH_INTERVAL));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  return { weather, greenkeeper, usga, jobs, errors, loading, lastRefreshed, countdown, refresh: fetchAll };
}

export default function App() {
  const { weather, greenkeeper, usga, jobs, errors, loading, lastRefreshed, countdown, refresh } = useDataFetch();

  const sources = [
    { label: "Weather", ok: !errors.weather },
    { label: "Greenkeeper", ok: !errors.greenkeeper },
    { label: "USGA Deacon", ok: !errors.usga },
    { label: "Task Tracker", ok: !errors.jobs },
  ];

  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Golf Operations Dashboard</h1>
            <p className="text-slate-500 text-sm">{today}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live data
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Status bar */}
        <StatusBar
          sources={sources}
          onRefresh={refresh}
          loading={loading}
          lastRefreshed={lastRefreshed}
          nextRefreshIn={countdown}
        />

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeatherCard data={weather} loading={loading} />
          <GreenkeeperCard data={greenkeeper} loading={loading} />
          <USGACard data={usga} loading={loading} />
          <JobsCard data={jobs} loading={loading} />
        </div>
      </div>
    </div>
  );
}
