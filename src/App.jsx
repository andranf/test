import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, LayoutDashboard } from "lucide-react";
import "./index.css";
import AnimatedCanvas   from "./components/ui/AnimatedCanvas";
import GaugeRing        from "./components/ui/GaugeRing";
import AnimatedNumber   from "./components/ui/AnimatedNumber";
import WeatherCard      from "./components/WeatherCard";
import GreenkeeperCard  from "./components/GreenkeeperCard";
import USGACard         from "./components/USGACard";
import JobsCard         from "./components/JobsCard";
import TDRCard          from "./components/TDRCard";
import StatusBar        from "./components/StatusBar";
import BlogPage         from "./components/blog/BlogPage";
import { fetchWeather }     from "./services/weatherService";
import { fetchGreenkeeper } from "./services/greenkeeperService";
import { fetchUSGA }        from "./services/usgaService";
import { fetchJobs }        from "./services/jobsService";
import { fetchTDR }         from "./services/tdrService";
import { fetchDisease }     from "./services/diseaseService";

const REFRESH_INTERVAL = 120;

function useDataFetch() {
  const [weather,     setWeather]     = useState(null);
  const [greenkeeper, setGreenkeeper] = useState(null);
  const [usga,        setUSGA]        = useState(null);
  const [jobs,        setJobs]        = useState(null);
  const [tdr,         setTDR]         = useState(null);
  const [disease,     setDisease]     = useState(null);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown,   setCountdown]   = useState(REFRESH_INTERVAL);
  const timerRef     = useRef(null);
  const countdownRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetchWeather(), fetchGreenkeeper(), fetchUSGA(), fetchJobs(), fetchTDR(), fetchDisease(),
    ]);
    const e = {};
    if (results[0].status === "fulfilled") setWeather(results[0].value);     else e.weather     = results[0].reason?.message;
    if (results[1].status === "fulfilled") setGreenkeeper(results[1].value); else e.greenkeeper = results[1].reason?.message;
    if (results[2].status === "fulfilled") setUSGA(results[2].value);        else e.usga        = results[2].reason?.message;
    if (results[3].status === "fulfilled") setJobs(results[3].value);        else e.jobs        = results[3].reason?.message;
    if (results[4].status === "fulfilled") setTDR(results[4].value);         else e.tdr         = results[4].reason?.message;
    if (results[5].status === "fulfilled") setDisease(results[5].value);     else e.disease     = results[5].reason?.message;
    setErrors(e);
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
    countdownRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : REFRESH_INTERVAL), 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  return { weather, greenkeeper, usga, jobs, tdr, disease, errors, loading, lastRefreshed, countdown, refresh: fetchAll };
}

// Derive an overall course health % from greenkeeper zones
function courseHealthPct(gk) {
  if (!gk?.zones?.length) return null;
  const healthy = gk.zones.filter(z => z.color === "green" || z.color === "yellow").length;
  return Math.round((healthy / gk.zones.length) * 100);
}

function healthColor(pct) {
  if (pct == null) return "#64748b";
  if (pct >= 80)   return "#34d399";
  if (pct >= 60)   return "#fbbf24";
  return "#f87171";
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const { weather, greenkeeper, usga, jobs, tdr, disease, errors, loading, lastRefreshed, countdown, refresh } = useDataFetch();

  const sources = [
    { label: "Weather",      ok: !errors.weather,  battery: weather?.battery,  signal: weather?.signal  },
    { label: "Greenkeeper",  ok: !errors.greenkeeper  },
    { label: "USGA Deacon",  ok: !errors.usga         },
    { label: "Task Tracker", ok: !errors.jobs         },
    { label: "TDR 350",      ok: !errors.tdr          },
    { label: "Disease",      ok: !errors.disease      },
  ];

  const today  = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const pennantDate = new Date("2026-04-25");
  const hole4Date   = new Date("2026-04-10");
  const daysTo = (d) => Math.ceil((d - new Date()) / 86400000);
  const pennantDays = daysTo(pennantDate);
  const hole4Days   = daysTo(hole4Date);
  const health = courseHealthPct(greenkeeper);
  const stimp  = usga?.metrics?.find(m => m.name.toLowerCase().includes("speed") || m.name.toLowerCase().includes("stimp"))?.value;
  const overdueCount = jobs?.byStatus?.Overdue ?? null;

  if (view === "blog") {
    return (
      <div className="blog-shell">
        <header className="blog-topbar">
          <div className="blog-topbar-inner">
            <div className="flex items-center gap-4">
              <span className="blog-wordmark">TurfNerd</span>
              <span className="blog-handle">andrewturfnerd</span>
            </div>
            <button
              onClick={() => setView("dashboard")}
              className="blog-dash-btn"
            >
              <LayoutDashboard size={13} />
              GreenOps
            </button>
          </div>
        </header>
        <BlogPage />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden turfnerd-bg">

      {/* Canvas fluid background */}
      <AnimatedCanvas />

      {/* Page content */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y:   0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-7xl mx-auto mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* Brand */}
            <div>

              <p className="text-xs font-bold tracking-[0.28em] uppercase mb-1"
                style={{ color: "rgba(52,211,153,0.65)" }}>
                Cranbourne West · Victoria
              </p>
              <div className="flex items-baseline gap-3">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none turfnerd-title">
                  Ranfurlie
                </h1>
                <span className="text-xl md:text-2xl font-semibold"
                  style={{ color: "rgba(52,211,153,0.8)" }}>
                  GreenOps
                </span>
              </div>
              <p className="text-xs mt-2 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                {today} · Always below par
              </p>
              {/* Milestone pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background:"rgba(251,191,36,0.12)", color:"#fcd34d", border:"1px solid rgba(251,191,36,0.25)" }}>
                  Div 1 Pennant — {pennantDays}d
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background:"rgba(52,211,153,0.10)", color:"#6ee7b7", border:"1px solid rgba(52,211,153,0.22)" }}>
                  4th hole opens — {hole4Days}d
                </span>
              </div>
            </div>

            {/* Quick-look KPIs */}
            <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Course Health ring */}
              {!loading && health != null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="glass-card px-4 py-3 flex items-center gap-3"
                >
                  <GaugeRing value={health} max={100} size={72} strokeWidth={6}
                    color={healthColor(health)} unit="%" label="Course Health" />
                  <div className="flex flex-col gap-2">
                    {stimp != null && (
                      <div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Stimp</p>
                        <p className="text-xl font-bold text-white stat-num">
                          <AnimatedNumber value={stimp} decimals={1} /> ft
                        </p>
                      </div>
                    )}
                    {overdueCount != null && (
                      <div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Overdue</p>
                        <p className="text-xl font-bold stat-num"
                          style={{ color: overdueCount > 0 ? "#f87171" : "#34d399" }}>
                          <AnimatedNumber value={overdueCount} />
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Live pulse */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"
                    style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9)" }} />
                </span>
                <span className="text-sm font-bold" style={{ color: "rgba(52,211,153,0.9)" }}>Live</span>
              </div>
            </div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto flex flex-col gap-5">

          {/* Status bar + blog nav */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1,  y:  0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1">
              <StatusBar
                sources={sources} onRefresh={refresh} loading={loading}
                lastRefreshed={lastRefreshed} nextRefreshIn={countdown}
              />
            </div>
            <button
              onClick={() => setView("blog")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#6ee7b7"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <BookOpen size={12} /> TurfNerd
            </button>
          </motion.div>

          {/* Card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              <WeatherCard     data={weather}     loading={loading} disease={disease} />,
              <GreenkeeperCard data={greenkeeper} loading={loading} />,
              <USGACard        data={usga}        loading={loading} />,
              <JobsCard        data={jobs}        loading={loading} />,
              <TDRCard         data={tdr}         loading={loading} />,
            ].map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 48, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
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
