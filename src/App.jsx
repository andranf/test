import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
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

const REFRESH_INTERVAL = 120;

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL * 1000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

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
    { label: "Weather",      ok: !errors.weather },
    { label: "Greenkeeper",  ok: !errors.greenkeeper },
    { label: "USGA Deacon",  ok: !errors.usga },
    { label: "Task Tracker", ok: !errors.jobs },
  ];

  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const cards = [
    <WeatherCard     data={weather}     loading={loading} />,
    <GreenkeeperCard data={greenkeeper} loading={loading} />,
    <USGACard        data={usga}        loading={loading} />,
    <JobsCard        data={jobs}        loading={loading} />,
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#030712" }}>

      {/* Fixed animated gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb-1 absolute" style={{
          top: "-220px", left: "-220px", width: "750px", height: "750px",
          background: "radial-gradient(circle at center, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.05) 50%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div className="orb-2 absolute" style={{
          top: "25%", right: "-280px", width: "850px", height: "850px",
          background: "radial-gradient(circle at center, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div className="orb-3 absolute" style={{
          bottom: "-180px", left: "30%", width: "650px", height: "650px",
          background: "radial-gradient(circle at center, rgba(139,92,246,0.13) 0%, rgba(139,92,246,0.03) 50%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }} />
      </div>

      {/* Page content */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-7xl mx-auto mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-1.5"
                style={{ color: "rgba(52,211,153,0.7)" }}>
                Operations Dashboard
              </p>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight leading-none"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Golf Course
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.32)" }}>{today}</p>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"
                  style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)" }} />
              </span>
              <span className="text-sm font-semibold" style={{ color: "rgba(52,211,153,0.85)" }}>Live</span>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto flex flex-col gap-5">

          {/* Status bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <StatusBar
              sources={sources}
              onRefresh={refresh}
              loading={loading}
              lastRefreshed={lastRefreshed}
              nextRefreshIn={countdown}
            />
          </motion.div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                transition={{ duration: 0.6, delay: 0.28 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {card}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
